---
layout: post
title:  "Making Verification Compelling: Visual Verification Feedback for Dafny"
date:   2023-04-12 18:00:00 +0100
author: Mikael Mayer
---
<link rel="stylesheet" href="/blog/assets/css/verification-compelling.css"></link>
If, one day, one of your developers introduced a bug that ends up costing your company millions,
as it happens occasionally, what would be your first thought, as the manager? Probably

<div class="quote">
"How could I have prevented this from happening"?
</div>
  
Now you'll start hoping this will not happen, and you have good reasons to think so:
- "We have regression tests, integrations test, unit tests, alpha and beta testers."
- "We have code coverage and we are at 100% ... Well, almost, every uncovered line is documented."
- "We have the best talent here, they hopefully won't fail."

And then, a dreaded thought reappears: "Well, despite all these efforts, how can I be sure that this won't happen?". You remember your other efforts:

- "We did try to make a model out of our algorithms and prove properties, but, well
  only that senior mathematician on another specialized team can understand and maintain it, and they are retiring soon..."
- "My developers have tried using modeling tools themselves but it's like... manipulating mathematics is discouraging..."

If only doing mathematics at the software level was engaging and compelling... and then you remember Dafny and its new features you will have read about in this blog post.

### What?

I'll explain how mathematical reasoning of programs can be made _more_ engaging by increasing the amount of negative, contextual and especially positive feedback in Dafny,
The success was to the point point where a user spontaneously said:
<div class="quote">
"It's ridiculous how good all green gutter feels"
</div>

After asking them if we could quote that sentence, another user added _"If he won’t, I say it for you to use"_. A third one said:

<div class="quote">
"Oh these little icons on the left, they are super useful"
</div>
Isn't that a super cute testimony?

## Dafny

### Quick story of Dafny

Dafny started as an imperative programming language with built-in support for verification in 2009, but you probably haven't heard a lot about it in the news. It's because it's in a special niche: It is meant for programmers, but designed with verification as the first goal in mind.

Dafny has been successfully used in several industrial and academics settings.
With its Java-like syntax and good type inference, Dafny has [2k stars on GitHub](https://github.com/dafny-lang/dafny).
Dafny is being used both academic circles to [teach formal reasoning](http://www.doc.ic.ac.uk/~scd/Dafny_Material/Lectures.pdf), as well as in industrial projects like [IronFleet](https://github.com/microsoft/Ironclad/blob/main/ironfleet/README.md) and [IronClad projects](https://github.com/microsoft/Ironclad/blob/main/ironfleet/README.md), as part of the [AWS Encryption SDK](https://github.com/aws/aws-encryption-sdk-dafny) and as the model for the [Amazon Verified Permissions](https://aws.amazon.com/verified-permissions/).

Under the hood, Dafny reasons about programs, and can not only prove the absence of run-time exceptions, but also invariants and specific properties relating inputs and outputs.

### A quick introduction to Dafny

By now, you might want to know what does it mean to reason about programs _mathematically_ to avoid bugs that tests might not cover. It's your lucky day, I made an animation to explain the process. Here is an example of an unoptimized program that computes the euclidian division in Dafny. To go to the next step, click "Next".

{% include verification-compelling-intro.html %}

If you want to know how Dafny translates these programs into mathematical formulas, [have a look at this discussion](https://github.com/dafny-lang/dafny/discussions/1898#discussioncomment-2344533).

Ok, so now you know how Dafny works if it was run on the command line.
For now, let's focus on the most interesting part that changed since the last year: The IDE.

## Users feel the lack of feedback on the IDE

I regularly meet Dafny users, and sometimes ex-Dafny users, and I realize that they all had a hard time using Dafny. Not the language itself, but the verification experience part.
Let's say it, the IDE interface was not very friendly for many aspects. As it replicated the command line, until mid-2022, the IDE of choice for Dafny, [VSCode](https://code.visualstudio.com/), was doing for verification nothing more than running the command line and displaying verification error annotations in context.

Users frequently had questions such as:

* **Are verification diagnostics obsolete?**
  If a file verified in 30 seconds, it meant users had to wait all this time before getting feedback about the line they were working on. Diagnostics used to be published only once, after Dafny checked everything. Imagine the frustration of waiting 30 seconds to know if what you wrote made sense for Dafny, 50 times per day...
* **Is Dafny actually stuck?**
  Not long ago, the Dafny extension had numerous problems requiring regular restarts, so it was even more frustrating. Users were ditching the "verification on change" mode and used "verification on save" to minimize the number of restarts, which impacted their experience a lot. The biggest problem was, there was no way to differentiate between "Dafny is stuck" and "Dafny is thinking".
* **Can we not verify a single method at a time?**
  Users often commented out code, adding `{:verify false}` or `assume false;` statements in the code to force Dafny to ignore already proved code. When they wanted to verify a single method, I've seen users go back to the command line (sigh).
* **Where are the hidden assertions? What are they proving?**
  Dafny proves a ton of assertions that were never explicitly asserted by the user, such as preconditions, divisions by zero, or memory reading/writing conditions. If the program was verified, the users would usually have no idea of how much complex verification was performed, which did not provide as much assurance as if users knew all the work Dafny did.
* **Is there no error on this assertion because it's verified, or because Dafny has no information about it?**
  Dafny made it clear where it found errors, but the absence of errors in some portions of a method could be due to Dafny not investigating further, because it has a default limit of 5 errors reported per method.
  So basically, it was impossible to know things about assertions that are not underlined in red as errors.
* **Are there still assertions to prove in my current method?**
  Professional programmers often wrote methods longer than could be displayed on the screen at once. Because postconditions are written at the beginning of a method, such users often needed to scroll back up to see if they finally proved it. Having no contextual information about the entire method verification status was painful.

So many questions that would block not only novice Dafny users, but also expert ones. Using Dafny myself, and supported by the entire Dafny team, I felt the strong need to do something about it.

## Gutter-icon-based verification feedback

Gutter icons brought the first solution in that they offered easy-to-read and enhanced contextual feedback.
You might remember the animated screenshot of [our previous blog post](/blog/2023/03/03/dafny-4-released/):

![Dafny 4 IDE features](/blog/assets/images/Dafny4IDEFeatures.gif)

I'm now going to explain in detail what is happening on the left of the code (the _gutter_), and how I designed it and especially how it answered many of the questions users were asking, sometimes unconciously.

Numerous test engines also display feedback in the gutter next to the methods themselves, or next to the method calls if they are tests (e.g. [Wallaby.js](https://wallabyjs.com/), [xUnit](https://xunit.net/docs/getting-started/netfx/jetbrains-rider)...).
Such feedback is contextual, meaning it can be associated to the line of code it is attached to, as opposed to diagnostics that are listed in a separate window.
Because unit tests are much less common than pre- and postconditions in Dafny,
and because I had the possibility to customize the icon for every line, I wondered:
how can I leverage the gutter area to display verification feedback instead of usual test feedback? 

While thinking about how to display verification feedback in the gutter, I established some principles that guided us during the design of both the icons and the user experience:

* **Verified is visible but the least distracting:** The icons for verified code should provide a simple positive feedback.
* **Accessibility:** The icons should not just have colors, but also easily recognizable shapes, so that color-blind people could still benefit from them.
* **Compatibility with themes:** The icon colors should be adequate both in light and dark mode.
* **Compatibility with modes:** The icons should work both if the user triggers verification on save, or if verification is triggered each time users type something
* **Context-awareness:** The icons should not just convey the verification status of a single line, but, where appropriate, they may also convey verification feedback about the surrounding context.
* **Past-awareness:** Icons indicating ongoing computation should still display previous verification status, so that it is not lost.
* **No ambiguity:** The icons should be simple, straightforward, and not be ambiguous when looked from the side of the field of vision, so that users can focus on their code.

See below these icons in the current version of Dafny, on Visual Studio Code, when other gutter icon features are disabled.

<div id="fig_static_icons_dark_light"></div>
[<img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%"/>](/blog/assets/images/verification-compelling/example1.png) [<img src="/blog/assets/images/verification-compelling/example2.png" alt="Dafny gutter icons on light theme" width="45%"/>](/blog/assets/images/verification-compelling/example2.png)
<div style="text-align:center;font-style:italic">
Fig 1. The new verification gutter icons on the left of each screenshot, when Dafny finished verifying the file, in dark and light theme respectively. The error underlines come from diagnostics and were already there before.
</div>

[Figure 1](#fig_static_icons_dark_light) illustrates these icons in the current version of Dafny, on Visual Studio Code, when the other gutter icon features are disabled.
I will now explain the design of these icons with respect to the principles above. I will then cover the dynamics of these icons and further visual feedback that provide an experience I wish to be delightful.

In the following, a _declaration_ broadly consists of a block of code that Dafny can verify. [Figure 1](#fig_static_icons_dark_light) presents 4 declarations: line 2 to 4, line 6 to 8, line 10 to 14, and line 16 to 19.
In general, a declaration can be a method or a function with or without a body, a datatype definition, a constant declaration with or without a definition, or a subset type definition.

### The verification icon set

<div id="static-icons"></div>

#### Static icons

The first four icons that Dafny displays in the gutter are illustrated in [Figure 1](#fig_static_icons_dark_light):

* **A green thin vertical bar for verified code.** [Figure 1](#fig_static_icons_dark_light), lines 1 to 9. Green was the obvious color of choice for verified code. <img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%" style="float:left;width:25px;height:120px;object-fit:none;object-position:-6px 0;margin:3px"/> However, it was not obvious how to represent the notion of "verified". In test frameworks, there is usually a check in front of passing tests.
In Dafny, the equivalent of a test is the verification of an entire declaration. Therefore, I decided to have an icon that could help form a vertical gap-free line through the declaration. Because eyes are sensitive to pattern breaks, I also decided to fill empty lines adjacent to green vertical icons (lines 1, 5, 9) also with the same green vertical icons. That way, verified code is the least distracting of all, brings a sense of _relief_ when an entire error context goes away (see next points), and it conveys the idea that the default, or the goal, is to have verified icons.

* **A red rectangle for errors.** [Figure 1](#fig_static_icons_dark_light), line 13 and line 17. Red is the typical color for errors, so I used it for verification errors.
 <img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%" style="float:left;width:25px;height:48px;object-fit:none;object-position:-7px -409px;margin:3px"/> Similar to the choice of green, I used a less saturated red to avoid being too bright. The rectangle was one way to provide a prominent indication that there is at least one error on the line. The width of this rectangle is greater than the width of the verified icon, because it has to catch the eye when scrolling. If you look at it closely, you will also see that it is surrounded by two thin yellow lines (see the next point).

* **Two vertical yellow lines for error context.** [Figure 1](#fig_static_icons_dark_light), lines 10-14 and 16-19. I wanted users to immediately recognize declarations that have errors.
 <img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%" style="float:left;width:25px;height:48px;object-fit:none;object-position:-7px -370px;margin:3px"/> That way, even if declarations span more than one screen and there are no more single-line errors on the screen, users would still know that work needs to be done in the surrounding declaration. I chose the color yellow for that, as it is the typical color for warnings. For the choice of shape, I used the _clogged pipe_ metaphor, as if the context was a pipe in which errors were preventing the flow. This is how I ended up using two vertical yellow lines that were separated by the same width as the red rectangle.

* **A circle with a check mark for partially proved assertions.** [Figure 1](#fig_static_icons_dark_light), line 11 and line 18.
    While designing the icons, we got access to not only errors and declarations, <img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%" style="float:left;width:25px;height:35px;object-fit:none;object-position:-7px -588px;margin:3px"/>  but also to all the individual assertions. When Dafny finds an assertion it cannot prove, it will report it, assume it, and relaunch the verification process, up to five times per declaration. Therefore if, before the fifth time, it was able to prove that a declaration is correct, it means that every assertion not tagged with an error is partially proved.
    This is especially useful in the context of verification debugging, when one tries to copy and rewrite assertions towards the top of the declaration, manually applying the [weakest precondition calculus](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-verification-debugging).
    Not surprisingly, it solved the issue of users wondering if Dafny stopped at the first error or was able to prove the remaining. I also decided to not create an equivalent of this icon in a verified context, to keep the fully verified feedback as simple as possible.

#### Dynamic icons

Having icons for describing the verification status statically is great, but I found a clear benefit of using dynamic icons when displaying feedback. Typically, after looking at the verification diagnostics, users write more code or specifications, and then wait for verification to happen again. Verification can sometimes take dozens of seconds for a single file. so waiting for the entire verification of a file before updating icons would definitely not provide a good user experience...

I could just have removed verification icons while Dafny is verifying declarations. You can thank me, I did not chose this easy path, because I think that this would cause not only a disturbing blinking effect when verification is fast, but also make the user not benefit from immediate comparison with the previous status. In the [weakest precondition calculus](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-verification-debugging), I found it is helpful to see the red rectangle to "move up", as it often means that someone is bringing an error closer to the hypotheses. Erasing the intermediate feedback would put more strain on vision processing because users would have to visually re-align the icons and the (usually indented) code.

<div id="fig_dynamic_gutter_icons"></div>
[<img src="/blog/assets/images/verification-compelling/example-dynamic.png" alt="Dafny dynamic gutter icons" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>](/blog/assets/images/verification-compelling/example-dynamic.png)
<div style="text-align:center;font-style:italic">
Fig 2. Dynamic icons in chronological order.
The user first opens a file and goes through A, B and C. The user makes a typo in D on line 10. Then, the user fixes the typo and the error on line 11,
and goes in E. If verification is triggered, F, G and H happen next.
B, F and G have 2-frame animations where the zig-zag is animated every 1/5th of a second. H is where the green gutter feels, as reported by two users, "ridiculously good".
</div>

I identified three dynamic phases for Dafny to provide feedback about its verification status. To stay true to the past-awareness principle, I slightly modified the static icons presented in the [section about static icons](#static-icons) to convey the notion of Dafny "working on verification" while still displaying previous icons.
I present how these phases play together in [Figure 2](#fig_dynamic_gutter_icons).

* **The "verifying" phase.** In this phase, illustrated in screenshots C, F and G, the icons resemble the static icons, except that they are traversed by an animated zig-zag line that indicates that Dafny is working on that code portion, but the previous results are still visible.
* **The "obsolete" or "stale" phase.** This phase uses static and dimmed versions of the icons in the "verifying" phase. This phase is visible in screenshots A and E of [Figure 2](#fig_dynamic_gutter_icons), Dafny recognizes that something is new or has changed and that it is
    simply parsing and resolving the new code, but hasn't started verification yet.
* **The "unresolved" phase.** This phase uses gray scale versions of the "obsolete" icons, except for parsing and resolution errors which are indicated by red triangles containing an exclamation point, like D of [Figure 2](#fig_dynamic_gutter_icons).


I had to solve many challenges to ensure these icons provide the most adequate feedback.
For example, as soon as some input is entered, before parsing even occurs,
Dafny already migrates those icons according to string edits.
I also found the lightning metaphor to be adequate to provide the sense of "verification" on the side of the vision field without hiding the previous verification status.
However, I observed that if we just took the rectangle for error and put a lightning on it (yellow or transparent), it would just not be visible to the side of the vision field.
This is especially more important given that I modified Dafny to give per-method feedback.
This is why the red rectangle is split in screenshots E and F of [Figure 2](#fig_dynamic_gutter_icons), as if the error was about to "go away".

Among all the dynamic icons, note that the topmost part of [Figure 2](#fig_dynamic_gutter_icons) is less distinct than for code in error context. Without more information about the new code, I preferred the dynamic icons to reflect a kind of default hypothesis that previously verified code will probably also be verified.
I wanted Dafny to feel **more helpful than inquisitive**, i.e. **optimistic about the ability for the user to write correct code**.

I found it was appropriate to refresh these icons every time a declaration changes its verification status, in real-time. Moreover, in the current absence of a reliable caching mechanism, I added an edit detection mechanism to ensure that the last methods being edited are verified first.
In [Figure 2](#fig_dynamic_gutter_icons), verification being done on more than 2 cores, it was possible for the verification of the lines 1-7 to finish before the others.


#### Implementation details and cosmetics

<!--Things get deep now. Feel free to take a break if you really want to read this, or [skip to the next section](#enhancing-positive-and-negative-feedback) to learn more about things other than gutter icons.-->

To render static and dynamic icons, I used a z-buffer mechanism with clever codes for each icons.
I also have had special icons designed for the start and end of declarations with errors so that if flows nicely with verified code (for example <img src="/blog/assets/images/verification-compelling/example1.png" alt="Dafny gutter icons on dark theme" width="45%" style="width:25px;height:24px;object-fit:none;object-position:-7px -307px;margin:3px"/>)
In real-time feedback, I also delayed the display of gutter icons by 2 seconds in the presence of parse or resolution errors, to avoid icons blinking when typing fast.
Finally, I ensured that the scroll bar itself reflects gutter icons, so that it's possible to see at a glance if the entire file is verified, and if not, where to scroll.

<div id="enhancing-positive-and-negative-feedback"></div>

## Enhanced positive and negative hover feedback

Congratulations for reading until here! So far, you already have a sense on how the interface of Dafny is almost gamified with its on heads-up display or HUD, which contributes to making it delightful.

The gutter icons enhanced the user experience, but this was not enough. I found that I could further enhance the existing hover messages to provide useful insights and shortcuts. Let's compare before/after:

<div id="fig_previous_diagnostics"></div>
[<img src="/blog/assets/images/verification-compelling/hover-a.png" alt="Dafny previous hover messages" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>](/blog//blog/assets/images/verification-compelling/hover-a.png)
<div style="text-align:center;font-style:italic;margin-bottom:2em;">
Fig 3a. Previous diagnostics, highlighting and hovering. Although diagnostics are clickable, often users only need to get the failing related code immediately without changing context, so this is distracting.
Moreover, no further help is available to solve verification issues.
</div>
<div id="fig_new_diagnostics"></div>
[<img src="/blog/assets/images/verification-compelling/hover-b.png" alt="Dafny previous hover messages" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>](/blog//blog/assets/images/verification-compelling/hover-b.png)
<div style="text-align:center;font-style:italic;margin-bottom:2em;">
Fig 3b. New diagnostics, highlighting and hovering. Note that now failing postconditions are underlined as well (in reddish orange) and have a specific error message complementary to the error message at the return path.
The word "<b style="color:#3794ff">Error</b>" points to the very useful page of <a href="https://dafny.org/dafny/DafnyRef/DafnyRef#sec-verification-debugging">verification debugging when verification fails</a>. All related code snippets are visible and copyable on hover. The assertion number and number of resources are given.
</div>
<div id="fig_method_summary"></div>
[<img src="/blog/assets/images/verification-compelling/hover-c.png" alt="Dafny previous hover messages" style="display:block;margin-left:auto;margin-right:auto;width:500px;max-width:95%;"/>](/blog//blog/assets/images/verification-compelling/hover-c.png)
<div style="text-align:center;font-style:italic;margin-bottom:2em;">
Fig 4. Method summary on hover. Note the icon that points to <a href="https://dafny.org/dafny/DafnyRef/DafnyRef#sec-verification-debugging-slow">verification debugging when verification is slow</a> if the number of resource units exceeds a threshold (currently 10M). The costlier assertion batch's first line is given, which is useful if all assertions are verified separatedly using <a href="https://dafny.org/dafny/DafnyRef/DafnyRef#sec-vcs_split_on_every_assert"><code>{:vcs_split_on_every_assert}</code></a>
</div>

One aspect of program verification is that a single error might cover two or more places in the code. For example, post-conditions are asserted at every exit point of a declaration. Therefore, if this assertion fails, it fails on an exit point, and for the particular post-condition.
[Figure 3a](#fig_previous_diagnostics) shows that the error was never reported on the post-condition itself before (top image). Following user feedback, on [Figure 3b](#fig_new_diagnostics) I made the error visible on post-conditions, using a red-orange squiggly line in-code &mdash; to indicate it is a secondary error &mdash; and using the regular error icon in the gutter.
Moreover, because hovering is one of first way users can discover features, I added the following improvements to the hover experience, as shown in the bottom of [Figure 3b](#fig_new_diagnostics):

* We quote the exact code portions that Dafny could not prove
* On the <b style="color:#3794ff">Error</b> keyword, the usual color for links, I added a link to documentation we also wrote about how to [fix failing assertions](https://dafny.org/latest/DafnyRef/DafnyRef\#sec-verification-debugging).
* "This is assertion #1 of 2" explains how many assertions there are and where is this assertion roughly located in verification, which proved to be useful for [splitting verification in smaller tasks using annotations](https://dafny.org/latest/DafnyRef/DafnyRef\#sec-assertion-batches).
* "Resource usage: 9K RU" provides a deterministic metric on how many _resource units_ (RU) the solver used to reach this verification result. Resource units do not fluctuate like time would on multiple iterations, or when running on a different computer, although we found that both are correlated.
* Hovering a _proved_ assertion reveals similar insights, with a positive message instead of an error, such as "Success: The divisior is never zero".
* On hovering the line containing the method, if there are no other hovered assertions, I display a summary of verification as in [Figure 4](#fig_method_summary). This summary provides a link to the notion of [assertion batches]((https://dafny.org/latest/DafnyRef/DafnyRef\#sec-assertion-batches)) that helps splitting verification in smaller tasks, as well as a unicode warning icon `/!\` with a link to documentation to [fix verification when verification uses more than 10 million RU](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-verification-debugging-slow), a threshold I set by experience.
* To identify which assertion batches are the slowest and need more work, especially when using the annotation [`{:vcs_split_on_every_assert}`](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-vcs_split_on_every_assert), I displayed the top 3 most expensive assertion batches and line numbers.

# Summary

I explained why Dafny, how Dafny works, how gutter icons enhance the verification experience, how I designed the icons, and how I enhanced verification feedback using suitable hover messages. This, I believe, made the Dafny verification experience more accessible, more positive, and more enjoyable, for both new and existing users.
The story is not finished, but I hope that you enjoyed this first chapter!

# Acknowledgments

Adrianna Corona, for co-designing the icons and the user experience, while keeping the user needs in mind.
Aaron Tomb, for making positive versions of every error message and providing feedback on this post.
Ryan Emery, for being the first to ask me for gutter feedback à la [Wallaby.js](https://wallabyjs.com/).
Remy Willems, for restructuring the back-end of the language server and for the numerous code reviews.
Clément Pit-Claudel, for reviewing the wording of the hover messages.
Robin Salkeld, for the discussion about displaying resource units and the design of [`{:vcs_split_on_every_assert}`](https://dafny.org/dafny/DafnyRef/DafnyRef#sec-vcs_split_on_every_assert).
Rustan Leino, who inspired most of the content of the sections of Verification Debugging, which I wrote gradually after participating in sessions where he helped professional programmers.
Cody Roux, for the test and the first user quote.
Fabio Madge, for providing feedback on this post.

<script src="/blog/assets/js/verification-compelling-verification-steps.js"></script>
