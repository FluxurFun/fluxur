use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("FLXRTimeLock111111111111111111111111111111");

#[program]
pub mod fluxur_timelock {
    use super::*;

    /// Initialize a new timelock for a given mint.
    /// Creates a lock PDA to store metadata and a vault PDA to hold SOL.
    /// The creator is ALWAYS the payer/signer - cannot be user-supplied.
    pub fn initialize_lock(
        ctx: Context<InitializeLock>,
        mint: Pubkey,
        unlock_ts: i64,
    ) -> Result<()> {
        // Get current on-chain time
        let clock = Clock::get()?;
        let current_ts = clock.unix_timestamp;

        // Reject if unlock time is in the past or now
        require!(
            unlock_ts > current_ts,
            TimelockError::UnlockTimeInPast
        );

        // Get bumps before mutable borrow
        let lock_bump = ctx.bumps.lock;
        let vault_bump = ctx.bumps.vault;

        // Create the vault PDA as a system-owned account
        // This is done via CPI to system_program::create_account
        let rent = Rent::get()?;
        let vault_lamports = rent.minimum_balance(0);

        let vault_seeds: &[&[u8]] = &[
            b"vault",
            mint.as_ref(),
            &[vault_bump],
        ];
        let signer_seeds = &[vault_seeds];

        // Create vault account owned by system program (can hold SOL)
        anchor_lang::system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            vault_lamports,
            0,  // space = 0 (just holds lamports)
            &system_program::ID,  // owner = system program
        )?;

        // Initialize the lock account
        // SECURITY: Creator is ALWAYS the payer/signer, never user-supplied
        let lock = &mut ctx.accounts.lock;
        lock.creator = ctx.accounts.payer.key();
        lock.mint = mint;
        lock.unlock_ts = unlock_ts;
        lock.lock_bump = lock_bump;
        lock.vault_bump = vault_bump;

        msg!(
            "Timelock created: mint={}, creator={}, unlock_ts={}, current_ts={}",
            mint,
            lock.creator,
            unlock_ts,
            current_ts
        );

        Ok(())
    }

    /// Withdraw all SOL from the vault to the creator.
    /// Anyone can call this, but funds always go to lock.creator.
    /// Only succeeds if current time >= unlock_ts.
    pub fn withdraw(ctx: Context<Withdraw>, mint: Pubkey) -> Result<()> {
        let lock = &ctx.accounts.lock;
        let vault = &ctx.accounts.vault;

        // Get current on-chain time
        let clock = Clock::get()?;
        let current_ts = clock.unix_timestamp;

        // Check if unlock time has passed
        require!(
            current_ts >= lock.unlock_ts,
            TimelockError::LockNotExpired
        );

        // Verify the destination matches the creator stored in lock
        require!(
            ctx.accounts.creator.key() == lock.creator,
            TimelockError::InvalidCreator
        );

        // Calculate how much SOL we can transfer
        let vault_balance = vault.lamports();
        let rent = Rent::get()?;
        let rent_exempt_minimum = rent.minimum_balance(0);

        // Transfer everything above rent-exempt minimum
        let transfer_amount = vault_balance.saturating_sub(rent_exempt_minimum);

        if transfer_amount == 0 {
            msg!("Vault is empty, nothing to withdraw");
            return Ok(());
        }

        // Transfer SOL from vault PDA to creator using system_program::transfer
        // The vault is system-owned, so we need CPI with PDA signer
        let vault_seeds: &[&[u8]] = &[
            b"vault",
            mint.as_ref(),
            &[lock.vault_bump],
        ];
        let signer_seeds = &[vault_seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            transfer_amount,
        )?;

        msg!(
            "Withdrawn {} lamports from vault to creator {}",
            transfer_amount,
            lock.creator
        );

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(mint: Pubkey, unlock_ts: i64)]
pub struct InitializeLock<'info> {
    /// The payer who pays for rent AND becomes the creator
    /// SECURITY: This ensures creator is always the signer
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The lock PDA that stores timelock metadata
    #[account(
        init,
        payer = payer,
        space = 8 + LockAccount::INIT_SPACE,
        seeds = [b"lock", mint.as_ref()],
        bump
    )]
    pub lock: Account<'info, LockAccount>,

    /// The vault PDA that will hold SOL
    /// Created via CPI in the instruction body as a system-owned account
    #[account(
        mut,
        seeds = [b"vault", mint.as_ref()],
        bump
    )]
    /// CHECK: Created via CPI as system-owned account. Safe because:
    /// 1. Seeds are deterministic from mint
    /// 2. Program controls creation and withdrawals via PDA signer
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct Withdraw<'info> {
    /// Anyone can call withdraw, but funds go to lock.creator
    pub caller: Signer<'info>,

    /// The lock PDA containing timelock metadata
    #[account(
        seeds = [b"lock", mint.as_ref()],
        bump = lock.lock_bump,
        has_one = creator @ TimelockError::InvalidCreator
    )]
    pub lock: Account<'info, LockAccount>,

    /// The vault PDA holding SOL (system-owned)
    #[account(
        mut,
        seeds = [b"vault", mint.as_ref()],
        bump = lock.vault_bump
    )]
    /// CHECK: System-owned vault PDA. Safe because we verify seeds/bump.
    pub vault: UncheckedAccount<'info>,

    /// The creator who receives the funds (must match lock.creator)
    /// CHECK: Validated against lock.creator via has_one constraint
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct LockAccount {
    /// The creator who will receive funds upon unlock
    /// SECURITY: Always set to the payer/signer of initialize_lock
    pub creator: Pubkey,
    /// The mint pubkey used as seed for PDAs
    pub mint: Pubkey,
    /// Unix timestamp when funds can be withdrawn
    pub unlock_ts: i64,
    /// Bump seed for lock PDA
    pub lock_bump: u8,
    /// Bump seed for vault PDA
    pub vault_bump: u8,
}

#[error_code]
pub enum TimelockError {
    #[msg("Unlock time must be in the future")]
    UnlockTimeInPast,
    #[msg("Lock has not expired yet")]
    LockNotExpired,
    #[msg("Invalid creator - must match lock.creator")]
    InvalidCreator,
}
