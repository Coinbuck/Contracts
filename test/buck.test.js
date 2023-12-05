const { expect } = require('chai');
const ethers=require('ethers');
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

    it('should have the correct decimals', async function () {
      const decimals = await this.buck.decimals();
      const expectedDecimals = new BN("18"); 
      expect(decimals).to.be.bignumber.equal(expectedDecimals);
    });
    

    it('should have the correct initial total supply', async function () {
      const totalSupply =  await this.buck.totalSupply();
      const expectedTotalSupply = new BN("1000000000000000000000000000");
      expect(totalSupply).to.be.bignumber.equal(expectedTotalSupply);
    });

    it('deploys with the deploying address as the initial owner', async function ()  {
      expect(await this.buck.owner()).to.equal(owner);
    });
    it('deploys with the same total supply as initial balance of deployer', async function ()  {

      const totalSupply =  await this.buck.totalSupply();
      const balance = await this.buck.balanceOf(owner);
      expect(totalSupply).to.be.bignumber.equal(balance);
    
    });

  

    it('only allows the owner to perform certain actions', async function () {
      await expectRevert(this.buck.renounceOwnership({ from: account1 }),'Ownable: caller is not the owner');  

      await expectRevert(this.buck.transferOwnership(account1,{ from: account1 }),'Ownable: caller is not the owner');  
    
    });
    it('does not allow transferring ownership to the zero address', async function () {
      await expectRevert(this.buck.transferOwnership(ZERO_ADDRESS),'Ownable: new owner is the zero address');
    });

    it('does not allow the pending owner to update the owner if not accepted', async function () {
      await expectRevert(this.buck.updateOwner({ from: account2 }),'Not pendind owner');
    });
  
    it('allows the owner to transfer ownership', async function () {
      await this.buck.transferOwnership(account2, { from: owner });
      const pendingOwner = await this.buck.pendingOwner();
      expect(pendingOwner).to.equal(account2);
      await this.buck.updateOwner({ from: account2 });
      const contractOwner = await this.buck.owner();
      expect(contractOwner).to.equal(account2);
    });

    it('should prevent setting zero address as new owner during transfer', async function() {
      await expectRevert(this.buck.transferOwnership(ZERO_ADDRESS, { from: owner }), 'Ownable: new owner is the zero address');
  });



    


    it('does not allow transferring to the zero address', async function ()  {
      const amount = new BN(100); // Set the amount to transfer
  
      await expectRevert(this.buck.transfer(ZERO_ADDRESS, amount, { from: owner }), 'ERC20: transfer to the zero address');
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

      it('should not allow transfers exceeding the sender balance', async function () {
        const initialBalanceOwner = await this.buck.balanceOf(owner);
        const addAmount=new BN("1");
        const amount = initialBalanceOwner.add(addAmount); // Attempt to transfer more than the balance
        // Try transferring more than the balance
        await expectRevert(this.buck.transfer(account1, amount,{from:owner}),'ERC20: transfer amount exceeds balance');
    
        // Ensure balances remain unchanged
        const finalBalanceOwner = await this.buck.balanceOf(owner);
        const finalBalanceReceiver = await this.buck.balanceOf(account1);
    
        expect(finalBalanceOwner).to.be.bignumber.equal(initialBalanceOwner);
        expect(finalBalanceReceiver).to.be.bignumber.equal(new BN("0"));
        
      });
      it('correctly handles transferring an amount of zero tokens', async function () {
        const amount = new BN(0);
    
        const initialBalance = await this.buck.balanceOf(owner);
        const initialBeneficiaryBalance = await this.buck.balanceOf(account1);
    
        await this.buck.transfer(account1, amount, { from: owner });
    
        const finalBalance = await this.buck.balanceOf(owner);
        const finalBeneficiaryBalance = await this.buck.balanceOf(account1);
    
        expect(finalBalance.toString()).to.equal(initialBalance.toString());
        expect(finalBeneficiaryBalance.toString()).to.equal(initialBeneficiaryBalance.toString());
      });
    
      it('allows transferring the entire balance to another account', async function () {
        const initialBalance = await this.buck.balanceOf(owner);
    
        await this.buck.transfer(account1, initialBalance, { from: owner });
    
        const finalBalance = await this.buck.balanceOf(owner);
        const finalBeneficiaryBalance = await this.buck.balanceOf(account1);
    
        expect(finalBalance.toString()).to.equal('0');
        expect(finalBeneficiaryBalance.toString()).to.equal(initialBalance.toString());
      });
    





      it ('handles a scenario where the spender has no allowance', async function () {
        const spender = account1;
        const amount = new BN(100);  
        // Check allowance before approval
        const allowanceBefore = await this.buck.allowance(owner, spender);
      
        // Attempt to transfer tokens from owner's account using no allowance
        await expectRevert(
           this.buck.transferFrom(owner, account2, amount,{from:spender}),
          'ERC20: insufficient allowance'
        )
        // Check allowance remains unchanged after the failed transfer
        const allowanceAfter = await this.buck.allowance(owner, spender);
        expect(allowanceAfter.toString()).to.equal(allowanceBefore.toString());
      });

        it('should throw error if balance is insufficient', async function() {
          const amount = new BN(100); // Set the amount to transfer    
          // Approve account1 to spend tokens on behalf of the owner
          await this.buck.approve(account1, amount, { from: account2 });
          await expectRevert (this.buck.transferFrom(account2, account1, amount, { from: account1 }),'ERC20: transfer amount exceeds balance');
    
        });

        it('should not allow transfers from blacklisted account when blackListEnabled is true', async function() {
          // Enable blacklisting
          const initialBalanceOwner = await this.buck.balanceOf(account1);
          const initialBalanceReceiver = await this.buck.balanceOf(account2);
          // Blacklist the owner's account
          await this.buck.blacklistAddress(account1,{from:owner});
          // Try transferring tokens from the blacklisted account
          await expectRevert(this.buck.transferFrom(account1, account2, 10,{from:account2}),'blacklisted');
          
          // Check balances remain unchanged
          const finalBalanceOwner = await this.buck.balanceOf(account1);
          const finalBalanceReceiver = await this.buck.balanceOf(account2);
      
          expect(finalBalanceOwner).to.be.bignumber.equal(initialBalanceOwner);
          expect(finalBalanceReceiver).to.be.bignumber.equal(initialBalanceReceiver);
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
       
        it('checks allowance correctly', async function () {    
          const allowance =await this.buck.allowance(owner, account1,{ from: owner });
          expect(allowance.toString()).to.equal(new BN(0).toString());

        });

        it('checks allowance after approving', async function ()  {
          const expectedAmount = new BN(1000);
          
          await this.buck.approve(account1, expectedAmount, { from: owner });
          const result = await this.buck.allowance(owner, account1, { from: account1 });
          expect(result.toString()).to.equal(expectedAmount.toString());
      });
       
  

        it('handles decreasing allowance correctly', async function () {
          const spender = account1;
          const initialAmount = new BN(100);
          const decreaseAmount = new BN(50);
        
          // Approve spender to transfer tokens
          await this.buck.approve(spender, initialAmount,{ from: owner });
        
          // Decrease allowance and check if the allowance is updated correctly
          await this.buck.decreaseAllowance(spender, decreaseAmount);
          const allowanceAfterDecrease = await this.buck.allowance(owner, spender);
        
          expect(allowanceAfterDecrease.toString()).to.equal(
            initialAmount.sub(decreaseAmount).toString()
          );
        });

        it('updates allowance correctly', async function () {
          const amount = new BN(100);
          const spender = account1;
        
          await this.buck.approve(spender, amount, { from: owner });
          const allowanceBefore = await this.buck.allowance(owner, spender);
        
          const newAmount = new BN(50);
          await this.buck.increaseAllowance(spender, newAmount, { from: owner });
          const allowanceAfter = await this.buck.allowance(owner, spender);
        
          expect(allowanceAfter.toString()).to.equal(allowanceBefore.add(newAmount).toString());
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


        it('checks user already blacklisted', async function () {
           const user = account1;
           await this.buck.blacklistAddress(user,{ from: owner });
           await expectRevert(this.buck.blacklistAddress(user,{ from: owner }),"already blacklisted");          // Disable blacklisting

        });

        it('checks user not blacklisted', async function () {
          const user = account1;
          await expectRevert(this.buck.removeBlacklistedAddress(user,{ from: owner }),"not blacklisted");          // Disable blacklisting

       });


        it('allows owner to add user to blacklisted address', async function () {
          const user = account1;
          await expectRevert(this.buck.enableBlacklisting({ from: user }),"Ownable: caller is not the owner");
          await expectRevert(this.buck.disableBlacklisting({ from: user }),"Ownable: caller is not the owner");

        });

        it('only allows owner to blacklist an address', async function () {
          const nonOwner = account1; // Select an account other than the owner
          const userToBlacklist = account2; // Choose an address to blacklist
          await expectRevert(this.buck.blacklistAddress(userToBlacklist, { from: nonOwner }),"Ownable: caller is not the owner");
          // Verify that the address is not blacklisted
          const isBlacklisted = await this.buck.blacklisted(userToBlacklist);
          expect(isBlacklisted).to.equal(false);
        });

        it('only allows owner to remove address from blacklist', async function () {
          const nonOwner = account1; // Select an account other than the owner
          const userToBlacklist = account2; // Choose an address to blacklist
          await expectRevert(this.buck.removeBlacklistedAddress(userToBlacklist, { from: nonOwner }),"Ownable: caller is not the owner");
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

      it('blacklisting disabled transfer will work normally', async function () {
        const amount = new BN(100); // Set the amount to transfer
        await this.buck.transfer(account1, amount, { from:owner});
        await this.buck.blacklistAddress(account1, { from: owner });
        await this.buck.disableBlacklisting({ from: owner });    
        const initialBalance = await this.buck.balanceOf(account1);
        const initialBeneficiaryBalance = await this.buck.balanceOf(account2); // Using account2 for transfer destination
        //  transfer from the blacklisted account (account1) to account2
          await this.buck.transfer(account2, amount, { from: account1 });    
        // balance will update after transfer
        const finalBalance = await this.buck.balanceOf(account1);
        const finalBeneficiaryBalance = await this.buck.balanceOf(account2);
        expect(finalBalance.toString()).to.equal(initialBalance.sub(amount).toString());
        expect(finalBeneficiaryBalance.toString()).to.equal(initialBeneficiaryBalance.add(amount).toString());   
    });

    it('blacklisting disabled transfer from will work normally', async function () {
      const amount = new BN(100); // Set the amount to transfer
      await this.buck.transfer(account1, amount, { from:owner});
      await this.buck.blacklistAddress(account1, { from: owner });
      await this.buck.disableBlacklisting({ from: owner });    
      await this.buck.approve(account2, amount, { from: account1 });

      const initialBalance = await this.buck.balanceOf(account1);
      const initialBeneficiaryBalance = await this.buck.balanceOf(account2); // Using account2 for transfer destination
        await this.buck.transferFrom(account1, account2,amount, { from: account2 });    
      // balance will update after transfer
      const finalBalance = await this.buck.balanceOf(account1);
      const finalBeneficiaryBalance = await this.buck.balanceOf(account2);
      expect(finalBalance.toString()).to.equal(initialBalance.sub(amount).toString());
      expect(finalBeneficiaryBalance.toString()).to.equal(initialBeneficiaryBalance.add(amount).toString());   
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



  it('prevents burning tokens more than the balance', async function () {
    const initialSupply = await this.buck.totalSupply();
    const burnAmount = initialSupply.add(new BN(10)); // Exceeding the total supply
    // Attempt to burn tokens more than the total supply
    await expectRevert(this.buck.burn(burnAmount),'ERC20: burn amount exceeds balance')
  });    
    });
});
