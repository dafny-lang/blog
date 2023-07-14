# Blog
The Dafny blog

# Running the blog locally

If it's the first time make sure you have [Bundler](https://jekyllrb.com/tutorials/using-jekyll-with-bundler/) installed.
Then, run in the directory:

> bundle install

If this fails, you might have an old Ruby version installed. Consider installing a Ruby version manager like [asdf](https://asdf-vm.com/), or [rbenv](https://github.com/rbenv/rbenv) to ensure you install the latest Ruby version through that version manager.

To run the server,

> bundle exec jekyll server --future

and then navigate to [http://127.0.0.1:4000/blog/](http://127.0.0.1:4000/blog/).
When you modify files, the website is automatically rebuilt, you only need to refresh the page. You'll also see upcoming blog posts.

# Writing blog posts

Blogs posts are in the `_posts` directory. They are named YEAR-MONTH-DAY-title.markdown.
The file name keeeps them ordered in the repository.
The front matter of each blog post actually contains the date at which the blog post will be visible.
The front matter looks like this, and is followed by the markdown code of your choice.
```
---
layout: post
title:  "How to optimize code while staying confident about it in Dafny"
date:   2023-07-14 18:00:00 +0100
categories: 
---
```
Don't put categories for now, as they change the URL.

Jekyll also offers powerful support for code snippets that hopefully will work one day for Dafny too:

{% highlight dafny %}
method Test() {
  print "Hello Dafny";
  assert false;
}
#=> prints 'Hello Dafny' to STDOUT.
{% endhighlight %}

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/

# Test the blog

To test the blog posts, run:

`make check`

If `make check` does not work, `make generate` might be able to fix things if ran locally, committed and pushed.

# Publish the blog post

- Make sure you merge the blog post. This will automatically run the workflow "pages build and deployment", so the publishing to dafny.org/blog is automatic
- If you merged the blog post before its date of publication, it won't appear.
  The above example's date is "2023-07-14 18:00:00 +0100" which means the blog post
  will be visible only if the publication process happens after 12pm central time on that day.
  Hence, if you merge the PR before that date, you need to run the workflow manually after the publication date:
  - Go to GitHub > Actions, and click on the last successful task "pages build and deployment"
  - Click on the button "Re-run all jobs"

# Local development

We encourage post authors to set up a custom pipeline, which continuously generates a single post. Make that pipeline accessible via

`make watch-X`

where X is a label that refers to the post, for example `make watch-compelling`.

