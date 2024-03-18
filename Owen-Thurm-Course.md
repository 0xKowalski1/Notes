# Principles of smart contract design

- Less Code
- Picky about storage variables ( at best inefficient, at worst lead to crtical bug due to mismatch of state )
  - Ideally no Parallel Data Structures!
- Unneccesary logic should happen off chain (frontend)
- For loops should be rare
- Unexpected in = unexpected out | Cut out unexpected paths
- handle all cases
- External Calls
  - Reentrancy | CEI, nonReentrant, Multi contract, read only
  - DoS | Fail
  - Return Values | Checked for all pos values, Unexpected bytes
  - Gas | If not trusted = dont forward all gas
- Post Checks | Bal > X

## Mission 1 should be done in ~200sloc

# Reentrancy

## Classic Reentrancy
follow CEI (nonReentrant)

## Cross Function Reentrancy
Classic reentrancy but the malicious user enters a different method that uses the out of date state
Follow CEI, nonReentrant wont catch this

## Cross Contract Reentrancy
Enters different contract that uses out of date state
Use CEI

## Read Only Reentrancy
Third party tries to read bad data
Use CEI!

## ERC721/ERC20 Reentrancy
Pay attention to safe transfers as they expose callbacks for reentrancy

## How to find
- enumerate external calls
- enumerate user inputs/calls
- collect outdated state for each call

# Principles of smart contract testing

## Unit Tests
Catch bugs early on

## Integration Tests
Catch bugs at the composability layer

https://youtu.be/DRZogmD647U?t=7745
