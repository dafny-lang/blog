---
layout: post
title:  "dafny-annotator: AI-Assisted Verification for Dafny"
author: Nada Amin and Gabriel Poesia
date:   2025-06-21 10:00:00 +0100
---

## The Cost of Bugs and of Verification

Software bugs remain a persistent and costly problem in the technology industry. According to a 2020 [report](https://www.it-cisq.org/the-cost-of-poor-software-quality-in-the-us-a-2020-report), poor software quality cost the US economy $2.08 trillion in that year alone. A range of tools for software development try to reduce this cost: various testing methods (unit, integration, regression tests), static and dynamic analysis tools, and software engineering practices like code reviews. 

Formal verification, as available in Dafny and other languages, offers the most rigorous defense against bugs we know of: we can mathematically prove that our code adheres to a given logical specification. Verification is the only approach that can ensure that programs work in all possible cases, not only in those that tests happened to cover.

While this is appealing in principle, verification unfortunately still has a steep cost. For instance, in [CompCert](https://compcert.org), a verified C compiler written and proven correct in the Coq proof assistant, the proofs of correctness take 8x more lines of code than the compiler itself. This cost hinders how much software actually gets verified in the real world.

Dafny was designed to significantly reduce the effort needed to write verified programs, leveraging SMT solvers to automate much of the verification process. However, users are still often required to provide logical annotations to guide the verifier when it doesn't succeed on its own. These annotations (such as assertions, loop invariants, and decreases clauses) require knowledge of formal semantics and logic that most software developers haven't been exposed to, creating a barrier to broader adoption.

To address this challenge, we proposed dafny-annotator: a tool that uses Large Language Models (LLMs) and search strategies to automatically add logical annotations to Dafny methods. The goal of dafny-annotator is to make writing formally correct programs more about stating what the program should do (its specification) and then implementing it to do that (its implementation), while the system works to help the Dafny verifier be convinced that the code is correct (i.e., the implementation matches the specification). While it is still a research prototype, we see great potential for AI to drastically reduce how hard it is to write formally verified software, hopefully helping drive adoption for languages like Dafny.

# Understanding the Annotation Challenge

Dafny shines in reducing the burden of proofs compared to most interactive theorem provers (e.g. Coq) where the responsibility in proving correctness is entirely on the user. To that end, Dafny leverages the Z3 SMT solver to attempt to prove most properties automatically. Z3 is very powerful, but users still need to manually help the solver in many cases, and how to do so is a major pain point for users. For a concrete example, consider a simple method that calculates the integer square root:


    method SquareRoot(N: nat) returns (r: nat)
      ensures r*r <= N < (r+1)*(r+1)
    {
      r := 0;
      while (r+1)*(r+1) <= N
      {
        r := r+1;
      }
    }

Dafny cannot verify the method fully automatically. This might be (a) because the specification is wrong, (b) because the implementation is wrong, or (c) because we need to manually add annotations to guide the verifier. Here, we're in case (c) --- the program and specification are correct ---, which is the case that dafny-annotator currently targets. It suffices to add `invariant r*r <= N` before the body of the while loop for Z3 to be able to prove the method's postcondition. dafny-annotator uses LLMs to attempt to insert these annotations automatically in the body of an existing method.

# dafny-annotator

The basic idea in dafny-annotator is to use an LLM to propose candidate annotations, and then find a location in the program where Dafny "accepts" that annotation (i.e. can prove what it states, such as the loop invariant or the assertion). More concretely, given a Dafny method with its formal specification and current implementation, dafny-annotator employs a simple strategy:

*LLM-Guided Greedy Search*

1. *Annotation Proposal*: The LLM is prompted with the current program and asked to generate K candidate annotations (assertions, invariants, or decreases clauses). For our experiments, we used K=5. The prompt shows the method being verified and asks for a single annotation that would help verify the program, without the need for the LLM to specify where that annotation should be placed.
2. *Insertion*: For each candidate annotation, dafny-annotator attempts to insert it at all syntactically valid locations within the method. For instance, loop invariants are tried on each loop, assertions after each statement. These attempts happen in parallel for efficiency.
3. *Greedy Selection*: The algorithm follows a greedy strategy by accepting the first annotation and location that enables Dafny to make progress (i.e., Dafny can prove the annotation correct, even if it cannot yet verify the whole method). If none of the candidates work at any location, the existing program remains unchanged.
4. *Repeat*: These steps repeat until either Dafny can verify the method's postcondition or a maximum number of iterations (5 in our implementation) is reached.

## Fine-Tuning for Annotation Generation

While general-purpose LLMs like Code Llama can generate plausible annotations, their performance improves significantly when fine-tuned on task-specific data. To create a fine-tuning dataset for annotation prediction, we leveraged existing annotated Dafny programs. In particular, we looked at [DafnyBench](https://arxiv.org/abs/2406.08467), a dataset of 1326 stand-alone Dafny files collected from Github.

Since we will use the LLM for predicting annotations, that is the task on which we should fine-tune it. Thus, we used a simple method for extracting training examples for this annotation prediction task out of existing programs. This works as follows:
1- Start with a verified Dafny program P containing annotations A₁, A₂, ..., Aₙ
2- Remove the last annotation Aₙ, creating a program P-Aₙ
3- Create a training pair (P-Aₙ, Aₙ) where the model is trained to predict the annotation Aₙ given the program P-Aₙ
4- Repeat this process with P-Aₙ, removing Aₙ₋₁ and creating a new pair
5- Continue until no annotations remain
This approach simulates the exact task dafny-annotator performs during inference: proposing the next annotation to insert. This gives us a simple way to take a dataset of Dafny programs and generate training examples to improve a given LLM for use in dafny-annotator.

## Initial results

To see how well this works, we conducted experiments using DafnyBench. We split the 1326 total programs in DafnyBench into 1000 programs for training and held out 326 for testing. After stripping all annotations from the test programs, only 83 actually failed to verify (i.e., for the others, Z3 can prove the specification without help, even if the human-written programs still contained annotations). These 83 programs become our evaluation set: we measured how many of these, after stripping all annotations, dafny-annotator was able to verify.

Our experiments used [LLaMa 3.1 8B](https://huggingface.co/meta-llama/Llama-3.1-8B) and [CodeLlama 7B](https://huggingface.co/codellama/CodeLlama-7b-hf) to guide dafny-annotator. The base LlaMa 3.1 8B model had a success rate of only 15.7% on this test set, with fine-tuning pushing it to 20.5%. CodeLlama had an even bigger improvement from fine-tuning: it initially was able to verify only 6% of the programs, which improved to 39.8% after fine-tuning.

Generally, the path to improving LLMs on a given task involves training them on more data. 
This presents a challenge for languages like Dafny, where the number of available programs is orders of magnitude smaller than for the most popular unverified languages, like Python. How, then, can we improve?

# DafnySynth: Scalable Synthetic Training Data for Dafny

To overcome the data scarcity problem for this task, we developed DafnySynth: a method (and an initial dataset) for synthesizing an arbitrarily large number of valid Dafny programs in principle. The approach follows a simple yet powerful observation: large programs are often written as a series of smaller edits to existing, smaller programs. Thus, the key idea will be to use an LLM to both propose small initial programs and iteratively grow them through edits, in an open-ended fashion. There is no exact goal to this process other than to generate a large number of correct Dafny programs (which we can check) for later training dafny-annotator.

## The Edit Graph Architecture

DafnySynth is built around an Edit Graph, a flexible architecture for this open-ended generation of programs where:


- Each node in the graph has a type (either "root", "idea", or "program") and content
- Edges represent derivation relationships between nodes
- "Editors" take existing nodes and generate new ones

The graph starts with a single root node with empty content, and grows through the application of various editors. For DafnySynth, we employed GPT-4o as the LLM underlying each of these editors, prompted to perform distinct tasks. We implemented the following editors:


- Idea Proposer: Takes the root node and generates high-level ideas for Dafny programs. These ideas are represented as natural language descriptions.
- Idea Implementer: Selects idea nodes and implements them as simple Dafny programs. The resulting code includes method signatures, specifications, and implementations, but may still lack necessary annotations for complete verification.
- Annotator: Takes program nodes that don't fully verify and adds annotations to help Dafny complete the proof. For the SquareRoot example introduced earlier, the Annotator could try to add the missing invariant we mentioned.
- Change Proposer: Makes incremental changes to an existing program, adding or modifying functionality. This editor ensures the graph grows in complexity, building on previous programs to create more sophisticated programs. In practice, we observed the vast majority of successful edits to simply consist of adding content (e.g. a new method) at the end of the file, or a new method to an existing class, rather than editing what is already there. The output of the Change Proposer might be either a fully verified program, or perhaps a program missing annotations (that the Annotator can try to complete later)

At every step, Dafny itself acts as a validation filter, ensuring that any proposed annotations are logically sound.

We spent just $10 in OpenAI API credits to generate a dataset comparable in size to DafnyBench. The resulting DafnySynth dataset contains 699 compilable Dafny programs, with 46 fully verified methods (Dafny can prove the post-conditions of all methods), and the rest partially verified. From these, we extracted 1107 valid annotations (678 invariants, 281 assertions, and 148 decreases clauses), of which 923 were syntactically unique. Each of these unique annotations, paired with the program where it was removed, becomes a training example for our fine-tuning process, just like when extracting examples from DafnyBench.

## Results: Combining Real and Synthetic Data

When we fine-tuned LLaMa 3.1 8B on both DafnyBench (the training set) and DafnySynth datasets together, dafny-annotator's success rate increased dramatically to 50.6% — the best result in our experiments. Interestingly, the same combination didn't yield similar improvements for CodeLlama 7B which hit a plateau at 39.8%, suggesting that general code pre-training isn't always more helpful for verification-specific tasks like generating Dafny annotations.
Overall, our approach demonstrates that synthetic data generation can effectively augment limited real-world examples, providing a promising path to improve LLM-based verification assistants if scaled up further. Given how little we had to spend to be able to see initial promising results, we're excited to push this direction further and see how far it can go.

# Conclusion: The Future of AI Assistance for Program Verification

Our work with dafny-annotator suggests a future where AI assistants can significantly reduce the cost of program verification. By lowering the barrier to entry, these tools may help drive wider adoption of languages like Dafny, ultimately improving software quality across industries.
While we focused only on generating logical annotations, we believe that AI might be helpful for the whole range of tasks involved in developing verified software:


- Specification generation: Helping users formalize natural language requirements into precise logical properties, or understand whether a given formal specification matches the user's intent.
- Lemma suggestion: Generating and proving auxiliary lemmas to help prove more complex properties. In our experiments, we assumed all necessary lemmas to already be present in the file, which is not necessarily the case during development.
- Implementation assistance: Proposing code given a formal specification, especially making the implementation easier to verify. Examples for this task can also be extracted from DafnySynth, since the resulting programs contain both specifications and their respective implementations.

An important aspect of building AI-assisted software is to communicate the domain with the tool. From our experience with dafny-annotator, we emphasize the following:

- The role of synthetic datasets: they can boost performance and can be easily created with discovery systems interleaving verification and generation (possibly with a stronger LLM than the targeted one). For us, it was a cheap experiment to boost from 15.7% to 50.6% success rate by using a synthetic dataset.
- Discovery systems like DafnySynth and Minimo can help create synthetic datasets tailored to train for specific needs.
- Dafny-annotator provides a very structured task for the LLM, compared to [VerMCTS](https://github.com/namin/llm-verified-with-monte-carlo-tree-search), which features free-for-all left-to-right completions. That structure can drive a tight neuro-symbolic coupling of LLM heuristics and symbolic brute force and verifiers.

Code and data for dafny-annotator and DafnySynth are available on [GitHub](https://github.com/metareflection/dafny-annotator).

