const { expect } = require('chai');
const {
  BN, // Big Number support
  expectRevert, // Assertions for transactions that should fail
  expectEvent,
  time,
  constants
} = require("@openzeppelin/test-helpers");

const { ZERO_ADDRESS } = constants;

// Load compiled artifacts
const Buck = artifacts.require('buckToken');

contract('buckToken', function ([ owner, beneficiary, account1, account2, account3 ]) {
  beforeEach(async function () {
    // Deploy a new Buck contract for each test
    this.buck = await Buck.new("BUCK", "BUCK", { from: owner });
  });

  describe("Deploy", function () {
    
    it('is initialized properly', async function () {
      expect(await this.buck.name()).to.equal("BUCK");
      expect(await this.buck.symbol()).to.equal("BUCK");
    });

    it('allows transferring tokens', async function () {
        const amount = new BN(100); // Set the amount to transfer

        const initialBalance = await this.buck.balanceOf(owner);
        const initialBeneficiaryBalance = await this.buck.balanceOf(account1);
    
        await this.buck.transfer(account1, amount, { from: owner });
    
        const finalBalance = await this.buck.balanceOf(owner);
        const finalBeneficiaryBalance = await this.buck.balanceOf(account1);
        expect(finalBalance.toString()).to.equal(initialBalance.sub(amount).toString());
        expect(finalBeneficiaryBalance.toString()).to.equal(initialBeneficiaryBalance.add(amount).toString());    
      });

      it('allows approving and transferring tokens from another account', async function () {
        const amount = new BN(100); // Set the amount to transfer
  
        // Approve account1 to spend tokens on behalf of the owner
        await this.buck.approve(account1, amount, { from: owner });
        
        // Transfer tokens from owner's account to account2 using account1's allowance
        await this.buck.transferFrom(owner, account2, amount, { from: account1 });
  
        const balanceAccount2 = await this.buck.balanceOf(account2);
        expect(balanceAccount2.toString()).to.equal(new BN(amount).toString());
      });

      it('enables and disables blacklisting', async function () {
        const user = account1;
  
        // Check initial blacklisting status
        const isBlacklistedInitial = await this.buck.blacklisted(user);
        expect(isBlacklistedInitial).to.equal(false);
  
        // Enable blacklisting
        await this.buck.blacklistAddress(user, { from: owner });
  
        // Check if user is blacklisted after enabling
        const isBlacklistedEnabled = await this.buck.blacklisted(user);
        expect(isBlacklistedEnabled).to.equal(true);
  
        // Disable blacklisting
        await this.buck.removeBlacklistedAddress(user, { from: owner });
  
        // Check if user is unblacklisted after disabling
        const isBlacklistedDisabled = await this.buck.blacklisted(user);
        expect(isBlacklistedDisabled).to.equal(false);
      });

      it('prevents transfer from blacklisted address', async function () {
        const amount = new BN(100); // Set the amount to transfer
    
        // Blacklist the account1 address
        await this.buck.blacklistAddress(account1, { from: owner });
    
        const initialBalance = await this.buck.balanceOf(owner);
        const initialBeneficiaryBalance = await this.buck.balanceOf(account2); // Using account2 for transfer destination
    
        // Attempt transfer from the blacklisted account (account1) to account2
        try {
            await this.buck.transfer(account2, amount, { from: account1 });
        } catch (error) {
            // Ensure that the transfer reverts with an error due to blacklisting
            expect(error.toString()).to.include('blacklisted');
        }
    
        // Check that balances remain unchanged after the attempted transfer
        const finalBalance = await this.buck.balanceOf(owner);
        const finalBeneficiaryBalance = await this.buck.balanceOf(account2);
    
        expect(finalBalance.toString()).to.equal(initialBalance.toString());
        expect(finalBeneficiaryBalance.toString()).to.equal(initialBeneficiaryBalance.toString());
    });

    it('burns tokens correctly', async function () {
      const amount = new BN(100); // Set the amount to transfer
      await this.buck.transfer(account1, amount, { from: owner });

      const initialSupply = await this.buck.totalSupply();
      const burnAmount = new BN(100); // Set the amount to burn

      const burner = account1; // Account with tokens to burn
      const initialBalance = await this.buck.balanceOf(burner);
  
      // Perform the burn operation
      await this.buck.burn(burnAmount, { from: burner });
  
      const finalSupply = await this.buck.totalSupply();
      const finalBalance = await this.buck.balanceOf(burner);
  
      // Check that the balance and total supply are updated correctly after burning
      expect(finalSupply.toString()).to.equal(initialSupply.sub(burnAmount).toString());
      expect(finalBalance.toString()).to.equal(initialBalance.sub(burnAmount).toString());
  });



  
  

  
   
  });

});
