---
layout: post
title:  "Formal Verification of EVM Bytecode in Dafny"
author: Franck Cassez
date:   2025-06-24 18:00:00 +0100
---

The [Ethereum network](https://ethereum.org/en/what-is-ethereum/) provides a decentralised execution environment powered by the [Ethereum Virtual Machine](https://ethereum.org/en/developers/docs/evm/) (EVM).
The EVM executes _smart contracts_, the programs that encode the business logic of decentralised applications (dApps) running on the network.
Smart contracts on Ethereum can be written in high-level languages like [Solidity](https://docs.soliditylang.org/) or [Vyper](https://vyperlang.org), but must be compiled to **EVM bytecode** to be executed by the EVM. 

A single vulnerability in a smart contract can result in huge financial losses.
Most security efforts focus on testing and auditing high-level source (Solidity or Vyper) code before deployment. However, because Ethereum executes EVM bytecode, not source code, verification at the bytecode level is essential for several reasons.

### EVM-Specific Features

The EVM has execution-level behaviours that are not visible in high-level Solidity or Vyper code, such as:

- **Stack overflows/underflows**. The EVM is a stack machine with a **fixed size stack**. Exceeding the maximum stack size (1024) results in an exception reverting execution without effect on the state of the system. Stack underflows may indicate issues in the compiler or bytecode generation, where an operation is executed without the required number of operands on the stack. In contrast, stack overflows are typically the result of executing deeply nested or recursive contract code that pushes too many values without sufficient pops. Both cases must be detected and handled by the EVM to ensure safe and predictable execution.
- **Gas consumption**. EVM execution is metered in [gas units](https://ethereum.org/en/developers/docs/gas/), that track resource usage. A program must declare before execution its maximum gas budget. If a program runs out of gas, it triggers an _out-of-gas exception_, reverting execution without effect on the state of the system. Analyzing gas usage at the bytecode level helps prevent unexpected failures due to insufficient gas.

### Compiler Bugs

Compilers may introduce errors during compilation, leading to incorrect or vulnerable bytecode. Recent examples include:
- 2023: A Vyper compiler reentrancy bug was exploited, resulting in $26M stolen  [The Vyper Compiler Saga: Unraveling the Reentrancy Bug that Shook DeFi](https://medium.com/rektify-ai/the-vyper-compiler-saga-unraveling-the-reentrancy-bug-that-shook-defi-86ade6c54265).
- 2022: A Solidity memory optimization issue mistakenly removed operations affecting computation [Overly Optimistic Optimizer -- Certora Bug Disclosure](https://medium.com/certora/overly-optimistic-optimizer-certora-bug-disclosure-2101e3f7994d).
- 2021: A Solidity dynamic array bug caused potential memory corruption [Bug Disclosure -- Solidity Code Generation Bug Can Cause Memory Corruption](https://medium.com/certora/bug-disclosure-solidity-code-generation-bug-can-cause-memory-corruption-bf65468d2b34).


The bytecode consists of low-level instructions, each representing a specific operation, identified by an _opcode_.
The EVM supports around 150 opcodes, covering a wide range of functionality, including arithmetic, memory and storage access, control flow.


## Objective


At the beginning of 2022, the Trustworthy Smart Contracts team at [ConsenSys](https://consensys.io) began developing a formal and executable semantics of the Ethereum Virtual Machine (EVM) [[1]](#ref1).

Our objective was to provide a **rigorous framework for reasoning about EVM bytecode**. Achieving this requires two key components: a **formal semantics** of the EVM and a **verification engine** capable of expressing and proving properties over that semantics. For this purpose, we chose [Dafny](https://dafny.org), a verification-aware programming language.
 Our choice of Dafny was motivated by two main factors:
- Several team members already had prior experience with Dafny, and
- Dafny offers a more developer-friendly experience compared to traditional theorem provers; its syntax is readable and approachable for developers, making the semantics easier to understand, maintain, and evolve.

In this post, I’ll introduce the Dafny-based EVM semantics, and explain how it can be used to formally verify properties of EVM bytecode.


## Related work 

In 2022, the most popular reference specification of the EVM was the [Yellow paper](https://ethereum.github.io/yellowpaper/paper.pdf), the most popular EVM implementation [go-ethereum (geth)](https://geth.ethereum.org), and there was a formal specification [KEVM](https://github.com/runtimeverification/evm-semantics) using the K-framework.
We used all these resources to understand and formally define the semantics of the EVM in Dafny.
We also ran the official EVM test suites on the Dafny-EVM to validate that our semantics closely matches the behavior of real-world EVM implementations.

The Dafny-EVM is the first formal specification of the EVM that can be reasoned about and executed.

# The Dafny-EVM

We have defined a formal and executable semantics, the **Dafny-EVM**, which is publicly available in the following repository [evm-dafny](https://github.com/Consensys/evm-dafny).
The main features of the Dafny-EVM are presented in this section. 


## EVM states

The EVM is a **stack-based** machine with **volatile** memory used during computation, and **permanent** storage, which persists across transactions. 
Permanent storage defines the state of the EVM and is updated by executing transactions. Transactions are sequences of bytecode instructions -- opcodes and their arguments -- and the EVM is a virtual machine that interprets the bytecode, executing one instruction at a time. If the execution of the instruction succeeds from a given state, the EVM reaches an `EXECUTING` state, and if an exception occurs (e.g. stack overflow) it reaches an `ERROR` state and the EVM halts.

The execution of EVM bytecode relies not only on opcodes, which define the functional behaviour, but also on a metering mechanism to prevent very long and possibly non-terminating executions.
This is enforced by limiting the resource usage (memory, operations) of each program.
Resource usage is measured in **gas** units. Every computation has a non-zero (gas) cost.
When a user submits a transaction, they also specify a **maximum gas budget**. If the execution of the transaction exceeds this budget, it is **halted**, and the state **reverted** to the state before executing the transaction, ensuring that the network remains responsive and can execute other transactions.


We have specified the state of the EVM as the datatype `State`:
```dafny
module EvmState {

  datatype State = 
      EXECUTING(evm: T)
    | ERROR(error: Error, gas: nat := 0, data: Array<u8> := [])

  datatype T = EVM(
    fork: Fork,                   //  version of the EVM
    context: Context.T,           //  sender of the transaction etc
    precompiled: Precompiled.T,   //  native functions
    world: WorldState.T,          //  global (permanent) storage
    stack: EvmStack,              //  stack of max size 1024
    memory: Memory.T,             //  volatile memory
    transient: TransientStorage.T,//  transient memory
    code: Code.T,                 //  bytecode to execute
    substate: SubState.T,         //  accounts destructed etc
    gas: nat,                     //  available gas units
    pc: nat                       //  program counter
  )
  
  datatype Error = 
      REVERTS                     
    | INSUFFICIENT_GAS            
    | INSUFFICIENT_FUNDS
    | INVALID_OPCODE
    | STACK_UNDERFLOW
    | STACK_OVERFLOW
    | MEMORY_OVERFLOW
    | BALANCE_OVERFLOW
    | RETURNDATA_OVERFLOW
    | INVALID_JUMPDEST
    | INVALID_PRECONDITION
    | CODESIZE_EXCEEDED
    | CALLDEPTH_EXCEEDED
    | ACCOUNT_COLLISION
    | WRITE_PROTECTION_VIOLATED
    ...
}
```
The complete definition of the state type along with some member functions is in the [state.dfy](https://github.com/Consensys/evm-dafny/blob/master/src/dafny/state.dfy) file within a module `EvmState`.


## Opcodes semantics


We have written the EVM semantics as **pure functions** that map a state of the EVM to a new state.
The advantage is that it is readable, language-agnostic (we use mathematical functions) and can be executed. 

The opcodes semantics are defined in the `Bytecode` module in [bytecode.dfy](https://github.com/Consensys/evm-dafny/blob/master/src/dafny/bytecode.dfy).
For example the [semantics of the ADD](https://github.com/Consensys/evm-dafny/blob/e2e52e86d6623d48d0849f5ce1664f88c8f0e547/src/dafny/bytecode.dfy#L45) opcode is as follows:

```dafny
module Bytecode {

  ...
  /**
   * Unsigned integer addition with modulo arithmetic.
   * @param   st  A state.
   * @returns     The state after executing an `ADD` or an `Error` state.
   */
  function Add(st: ExecutingState): (st': State)
    ensures st'.EXECUTING? || st' == ERROR(STACK_UNDERFLOW)
    ensures st'.EXECUTING? <==> st.Operands() >= 2
    ensures st'.EXECUTING? ==> st'.Operands() == st.Operands() - 1
  {
    if st.Operands() >= 2   //  Operands is the size of the stack
    then
      var lhs := st.Peek(0) as int;      //  top of stack
      var rhs := st.Peek(1) as int;      //  second element
      var res := (lhs + rhs) % TWO_256;  //  computes modulo 2^256
      st.Pop(2).Push(res as u256).Next() //  st -- Pop.Pop.Push.Next -> st'
    else
        ERROR(STACK_UNDERFLOW)
  }
  ...
```
First note that we can only apply this function to an `ExecutingState` and as Dafny is statically typed, this prevents us from
accidentally calling the `Add` function with an error state.
Second the definition of the semantics of `ADD` (lines 14-21) distinguishes two cases: 
1. **success**: if the stack has enough operands (`st.Operands >= 2`), the addition takes two arguments at the top of the stack, pops them, adds them and pushes the result on top the stack. It also advances the program counter to the next instruction (`Next`).
2. **exception**: if `st.Operands < 2`, the instruction cannot be executed and we reach an `ERROR` state.

The Dafny specifications (lines 10-12) help to identify the main properties of the `ADD` opcode:
- line 10: it results in either an executing state or an error state (runtime exception) of type `ERROR(STACK_UNDERFLOW)`.
- line 11: there is an exception if and only if the stack has less than 2 elements.
- line 12: if there is no exception, then the stack size decreases by one.


## Bytecode execution & Gas accounting

EVM bytecode comes as a sequence of bytes  of type `u8`, unsigned integers over 8 bits. 
To interpret the bytecode we need to decode the sequence of bytes into opcodes (and possibly their arguments).
The `EVM` module in [evm.dfy](https://github.com/Consensys/evm-dafny/blob/master/src/dafny/evm.dfy) provides some helpers to
execute the next instruction of the bytecode. 
The execution of an opcode is provided by the `ExecuteBytecode` function that matches a `u8` (byte) opcode to its semantics and applies the semantics to the state:

```dafny
 /**
  * Execute a given bytecode from the executing state.  This assumes gas has
  * already been deducted.  Again, this may or may not result in an executing
  * state, depending on whether the necessary conditions for execution were
  * met.  For example, executing an instruction (e.g. ADD) which requires
  * operands on the stack when there are no operands on the stack will result
  * in an error state.
  */
function ExecuteBytecode(op: u8, st: ExecutingState): State {
  match op
    case STOP  => Bytecode.Stop(st)
    case ADD   => Bytecode.Add(st)
    case MUL   => Bytecode.Mul(st)
    case SUB   => Bytecode.Sub(st)
    case DIV   => Bytecode.Div(st)
    case SDIV  => Bytecode.SDiv(st)
    case MOD   => Bytecode.Mod(st)

    ...

    // 0xf0
    case CREATE       => Bytecode.Create(st)
    case CALL         => Bytecode.Call(st)
    case CALLCODE     => Bytecode.CallCode(st)
    case RETURN       => Bytecode.Return(st)
    case DELEGATECALL => Bytecode.DelegateCall(st)
    case CREATE2      => Bytecode.Create2(st)
    case STATICCALL   => Bytecode.StaticCall(st)
    case REVERT       => Bytecode.Revert(st)
    case SELFDESTRUCT => Bytecode.SelfDestruct(st)
    case _            => ERROR(INVALID_OPCODE)
}
```

The bytecode to execute is part of the (`EXECUTING`) state of the EVM in the `code` section.
Given a state `st: ExecutingState`, `st.evm.code` contains the sequence of bytes that correspond to the bytecode, and `st.evm.pc` the current value of the program counter. The `Execute` function decodes the next instruction and computes the next state of the EVM:

```dafny
/**
 * Execute the next bytecode as determined by the current machine's state.
 * This requires decoding the bytecode at the current PC location.
 */
function Execute(st: ExecutingState): State {
  // Read opcode byte from code section.  If the read is out-of-bounds, then
  // STOP is returned by default.
  var opcode := Code.DecodeUint8(st.evm.code, st.evm.pc as nat);
  // Check fork supports given bytecode
  if st.evm.fork.IsBytecode(opcode)
  then
    // Deduct gas for the given bytecode.
    match DeductGas(opcode, st)
      // Not out of gas
      case EXECUTING(vm) => ExecuteBytecode(opcode, EXECUTING(vm))
      // Out of gas (or invalid opcode)
      case s => s
  else
    ERROR(INVALID_OPCODE)
}
```
This function performs the following checks:
- the opcode is valid for the given fork (line 10). EVM opcodes may be added or removed and the fork (A fork is a point in time where changes can be applied to the Ethereum infrastructure, including the EVM.) identifies the version that should be used to interpret the opcodes.  
- there is enough _gas_ to execute the next instruction (line 13). The `DeductGas` function returns an `ERROR` state if there is not enough gas to execute the opcode. If there is enough gas the cost of executing the opcode is deducted from the current gas budget and the corresponding new state is returned.


The Dafny-EVM separates the functional semantics of each opcode from the gas accounting, allowing for a clean, modular structure. This separation improves clarity, simplifies reasoning about correctness, and makes it easier to test or verify either aspect independently.

# Formal verification with the Dafny-EVM

In this section we show how to use the Dafny-EVM to formally prove some properties of bytecode.

## Overflow checker
The EVM computes modulo 2^256 and as a result it does not abort on arithmetic overflows (this is in contrast to other VMs for smart contracts like the MoveVM).
To detect arithmetic overflows the compiler (Solidity or Vyper) has to generate instrumented bytecode. For example detecting an overflow in an addition (opcode `ADD`) is done using the following bytecode snippet (assuming the two operands are top of the stack):

```assembly=
-------------------------
Address|Instruction|Stack
-------------------------
0x00:   DUP2            [a, b, a, ...]
0x01:   ADD             [a + b, a, ...]
0x02:   LT              [a + b < a, ...]
0x03:   PUSH1 0x07      [0x07, a + b < a, ...]
0x05:   JUMPI           [if a + b < a then goto 0x07 else goto next 0x06]
0x06:   STOP
0x07:   JUMPDEST        // Label of valid goto target. Overflow
0x08:   PUSH1 0x00      // prepare error code and data to return
0x10:   PUSH1 0x00
0x12:   REVERT          // Overflow: revert
```
The bytecode above uses the necessary and sufficient condition specified by lemma `AddOverflowNSC`:

```dafny
/** Necessary and sufficient condition for detecting overflow
 *  in ADD.
 */
lemma AddOverflowNSC(x: u256, y: u256)
  ensures x as nat + y as nat > MAX_U256
      <==> (x as nat + y as nat) % TWO_256 < x as nat
{
  //  Thanks Dafny
}
```
For two 256-bit unsigned integers `x, y: u256`, to detect whether `x + y` overflows we just need to check whether the result of the addition modulo 2^256 is less than `x` (or `y`).
We can formally prove that the instrumented code correctly detects overflows, and also that the lemma `AddOverflowNSC` is correct (thanks Dafny!).

First we define the bytecode as a sequence of opcodes for readability (the comments specify the content of the stack):
```dafny
/** Code snippet that detects overflow in addition. */
const OVERFLOW_CHECK := Code.Create(
  [
  // PC    Ins                stack [x, y, ...] top --> bottom
  // 0x00  
           DUP2,           //  [y, x, y, ...]
  // 0x01  
           ADD,            //  [y + x, y, ...] 
  // 0x02  
           LT,             //  [x + y < y?1:0, ...]
  // 0x03  
           PUSH1, 0x07,    //  [0x07, x < x + y?1:0, ...]
  // 0x05 
           JUMPI,          //  [...]
  // If stack(1) is 0 no overflow, STOP, otherwise JUMP to 0x07 and revert.
  // 0x06
           STOP,           //  Normal end of execution 
  // 0x07      0x08   0x09  0x10   0x11, 
     JUMPDEST, PUSH1, 0x00, PUSH1, 0x00, 
  // 0x12
     REVERT                //  Revert (exception)
  ]
)
```
Next we create a Dafny program that starts in an arbitrary `EXECUTING` state and executes the code `OVERFLOW_CHECK`:
```dafny
/**
 *  This is a pattern that is used to detect overflows for ADD.
 *
 *  @param  st  A state.
 *  @param  x   A u256.
 *  @param  y   A u256.
 *  @returns    A normal state with `x + y` top of stack if no overflow, a
 *              revert state otherwise..
 *  @note       The check relies on the property specified by lemma AddOverflowNSC.
 *  @note       The overflow is specified as x + y exceeding MAX_U256.
 */
method OverflowCheck(st: ExecutingState, x: u256, y: u256) returns (st': State)
  /** EXECUTING state and initial PC.  */
  requires /* Pre0 */ st.PC() == 0 && st.Fork() == EvmFork.BERLIN
  /** Enough gas. Longest path gas-wise is via JUMPI. */
  requires /* Pre1 */ st.Gas() >= 6 * Gas.G_VERYLOW + Gas.G_HIGH + Gas.G_JUMPDEST
  /** Initial stack is [x, y]. */
  requires /* Pre2 */ st.GetStack() == Stack.Make([x, y])
  /** The code is the snippet to detect overflow. */
  requires st.evm.code == OVERFLOW_CHECK
  /** The contract never runs out of gas thanks to Pre1. */
  ensures (st'.ERROR? && st'.error == REVERTS) || st'.RETURNS?
  /** Should revert iff overflow. */
  ensures (st'.ERROR? && st'.error == REVERTS) <==> x as nat + y as nat > MAX_U256
  /** Normal termination iff no overflow. */
  ensures st'.RETURNS? <==> x as nat + y as nat <= MAX_U256
{
  //  Execute 4 steps from st -- DUP2 ADD LT PUSH1 0x07
  st' := ExecuteN(st, 4);
  assert st'.PC() == 0x05;
  //  Depending on result of LT comparison overflow or not
  if st'.Peek(1) == 0 {
    st':= Execute(st');
    assert st'.PC() == 0x06;
    st' := Execute(st');
    assert st'.RETURNS?;
  } else {
    st':= Execute(st');
    assert st'.PC() == 0x07;
    st' := ExecuteN(st', 4);
    assert st'.ERROR? && st'.error == REVERTS;
  }
}
```
The method `OverflowCheck` has a few pre-conditions (`requires` lines 30--37) to initialise the EVM in a state has enough gas and operands to execute the `ADD`.
Dafny can prove the correctness of the method `OverflowCheck` which provides several guarantees.

First, the body of the method `OverflowCheck` executes the bytecode as follows:
- executes 4 steps from the initial state `st` (line 46). `ExecuteN` applies `Execute` (defined in the previous section) four times. Note that because `Execute` takes an `EXECUTING` state as a parameter, this implies that the first four execution steps do not result in an exception.
- after the four steps, we reach program counter `0x05`(verified at line 47). The instruction at `0x05` is a conditional jump `JUMPI` the semantics of which is: if the second element of the stack is non-zero, we jump (goto) to the address at the top of the stack; otherwise we continue to the instruction at `0x06`. 
- from `0x05`, there are two execution paths:
  * the `if-else` statement at line 49/54 verifies that if the second element of the stack `st'.Peek(1)` is non-zero, we jump to the instruction at `0x07` and otherwise we jump to `0x06`. 
  * depending on the path taken we execute one instruction (line 52) or 4 instructions (lines 57) to complete the execution of the bytecode. The assertions at lines 53 and 58 provide some guarantees about the type of the final state.


Second, the post-conditions (`ensures` lines 38--43) specifies the correctness of the overflow checker:
- the execution either succeeds with a `RETURNS` (normal state) or an exception of type `REVERTS` (error state). This rules out the out-of-gas-exception and this is why we provide enough gas (line 33) to execute the code.
- the execution reverts if and only if there is an overflow. 

This simple example demonstrates how the Dafny-EVM can be used to check real-life code albeit short, but code that is used repeatedly to detect exceptions and is critical to the correctness of the contracts.
A more detailed presentation of this example is available in this [Dafny-EVM github section](https://github.com/Consensys/evm-dafny/blob/master/VERIFICATION.md#an-overflow-checker).

## Optimisations

Another usage of the Dafny-EVM is to formally prove equivalence between code snippets.
Proposition 12 in [this Thesis](https://fenix.tecnico.ulisboa.pt/cursos/mma/dissertacao/1691203502343808) proposes to replace any sequence of the form `SWAPN POP^(N+1)` by `POP^(N+1)` (we use regular-language notation so `a^k` stands for `a` repeated `k` times).
The EVM supports the `SWAPN` instruction that swaps element `N+1` in the stack with the top of the stack for `1 <= N <= 16`.

We can formally verify that this optimisation is _correct_ and that the cost of the optimised version is _strictly less_ than the non-optimised one. 
To do so we create (lines 24 and 40) two virtual machines that start in the same state `vm` (line 21).
We then execute the two sequences, optimised (lines 25--33) and non-optimised (lines 41--52) separately and compare the results (lines 53--54) and the gas cost (line 56).
As Dafny can prove that this method `Proposition12b` is correct, we get a formal proof that the optimised version leads to the same state and is less expensive gas-wise.

Note that the proof is valid for any `N` between `1 <= N <= 16` which covers the range of the `SWAPN` instructions available in the EVM. 

```dafny
/**
 *
 *  Proposition 12: 
 *  n + 1 consecutive Pop  <_gas SwapN . n + 1 consecutive Pop
 *  Gas cost for POP is G_BASE and for SWAP G_VERYLOW
 *
 *  @param  n   As described above.
 *  @param  s   An initial stack content.
 *  @param  g   An initial value of gas.
 *
 *  @note       General case.
 *
 */
method Proposition12b(n: nat, s: seq<u256>, g: nat)
    requires 1 <= n <= 16
    /** Stack must have at least n + 1 elements. */
    requires n + 1 <= |s| <= 1024
    /** Minimum gas needed. */
    requires g >= (n + 1) * Gas.G_BASE + Gas.G_VERYLOW
{
    var vm := EVM.Init(gas := g, stk := s, code := []);

    //  Execute n + 1 POPs in vm1.
    var vm1 := vm;
    for i := 0 to n + 1
        invariant vm1.EXECUTING?
        invariant vm1.Gas() == g - (i * Gas.G_BASE)
        invariant vm1.Operands() >= n - i
        invariant vm1.GetStack() == vm.SlicePeek(i, |s|)
    {
        vm1 := Execute(POP, vm1);
        assert vm1.EXECUTING?;
    }
    assert vm1.Gas() >= Gas.G_VERYLOW;
    assert vm1.Gas() == g - ((n+1) * Gas.G_BASE);
    //  Stack after n + 1 POPs is suffix of initial stack starting at index n + 1
    assert vm1.GetStack() == vm.SlicePeek(n + 1, |s|);

    //  Execute SWAPn and then n + 1 POPs in vm2.
    var vm2 := vm;
    vm2 := Swap(vm2, n).UseGas(Gas.G_VERYLOW);

    for i := 0 to n + 1
      invariant vm2.EXECUTING?
      invariant vm2.Gas() == g - (i * Gas.G_BASE)  - Gas.G_VERYLOW
      invariant vm2.Operands() >= n + 1 - i
      invariant vm2.Operands() == vm.Operands() - i == |s| - i
      invariant vm2.SlicePeek(n + 1 - i, |s| - i) == vm.SlicePeek(n + 1, |s|)
    {
        vm2 := Execute(POP, vm2);
        assert vm2.EXECUTING?;
    }
    assert vm2.SlicePeek(0, |s| - n - 1) == vm.SlicePeek(n + 1, |s|);
    assert vm1.GetStack() == vm2.GetStack();
    assert vm2.Gas() == vm1.Gas() -  Gas.G_VERYLOW;
    assert vm2.Gas() < vm1.Gas();
}
```

A more detailed presentation of this example is available in this [Dafny-EVM github section](https://github.com/Consensys/evm-dafny/blob/master/VERIFICATION.md#evm-optimisations).

## Verification of arbitrary EVM bytecode

The examples we have given so far are relatively small and we can instrument or reason about the bytecode by manually annotating it with specifications.

But what about real-world smart contracts with thousands of instructions? 
To be able to formally reason about arbitrary EVM bytecode, we need to build an artefact that encodes the semantics of the bytecode and can be reasoned about.
A step into this direction is proposed in [[2]](#ref2): build _proof objects_ that are representations of EVM bytecode using the Dafny-EVM semantics.
In a nutshell, we generate instrumented EVM bytecode automatically by disassembling and analysing (resolving dynamic JUMPs) the bytecode.
The technique proposed in [[2]](#ref2) and implemented in Dafny in [this github repository](https://github.com/franck44/evm-dis) can disassemble real-world contracts (benchmarks of ~3000 lines of codes) and perform some verification. The automatic verification is for now limited to checking the absence of stack underflows/overflows but can certainly be extended to functional properties.

The proof objects can be further manually annotated with functional specifications and reasoned about like any Dafny program. This is certainly doable for relatively small pieces of code but there are still several hurdles to reason about EVM bytecode:
- the bytecode does not (usually) contain information about the high-level source code. For example, an addition in Solidity source code like `a + b` is compiled into and EVM bytecode using `PUSHes, POPs,` and `ADD` manipulating the stack, but there is no easy way in the bytecode to figure out that say `stack[1]` is `b` and `stack[0]` is `a`. This makes it hard to transfer high-level specification (in Solidity or Vyper) to EVM bytecode. 
- memory locations of elements of data structures like `maps` in high-level code (Solidity or Vyper) are computed in the bytecode using _hashes_. This makes it very hard to reason about any program that uses memory as the addresses of reads and writes are hard to evaluate. 
- the EVM has some instructions to dynamically call another contract.  In many instances, the called contracts are not known at compile-time, and it is almost impossible to include them in the verification model. To a certain extent, it is possible to reason about external calls in an adversarial environment as we have demonstrated in [[3]](#ref3) and [[4]](#ref4) using Dafny, but this is done at the source level (Dafny).


# References

<a id="ref1"></a>[1] Franck Cassez, Joanne Fuller, Milad K. Ghale, David J. Pearce, and Horacio M. A. Quiles. 2023. Formal and Executable Semantics of the Ethereum Virtual Machine in Dafny. In Formal Methods: 25th International Symposium, FM 2023, Lübeck, Germany, March 6–10, 2023, Proceedings. Springer-Verlag, Berlin, Heidelberg, 571–583. [https://doi.org/10.1007/978-3-031-27481-7_32](https://doi.org/10.1007/978-3-031-27481-7_32)

<a id="ref2"></a>[2]  Franck Cassez. ByteSpector: A Verifying disassembler for EVM bytecode. OASIcs, Volume 129. Forthcoming, Proceedings of Formal Methods for Blockchains (FMBC'25). [https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.FMBC.2025.4](https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.FMBC.2025.4)

<a id="ref3"></a>[3] Franck Cassez, Joanne Fuller, and Horacio M. A. Quiles. 2022. Deductive Verification of Smart Contracts with Dafny. In: Groote, J.F., Huisman, M. (eds) Formal Methods for Industrial Critical Systems. FMICS 2022. Lecture Notes in Computer Science, vol 13487. Springer, Cham. [https://doi.org/10.1007/978-3-031-15008-1_5](https://doi.org/10.1007/978-3-031-15008-1_5)

<a id="ref4"></a>[4] Franck Cassez, Joanne Fuller, and Horacio M. A. Quiles. 2024. Deductive verification of smart contracts with Dafny. Int. Journal Software Tools Technology Transfer 26, 131–145. [https://doi.org/10.1007/s10009-024-00738-1](https://doi.org/10.1007/s10009-024-00738-1)

[^fn]: 