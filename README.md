# KLEN &mdash; Kansas Law Enforcement Network

This repository contains the full source for the KLEN website, built with
[Jekyll](https://jekyllrb.com/) and published for free with GitHub Pages.
You do not need to know how to code to keep the site updated &mdash; this
guide walks through the common tasks in plain language.

---

## 1. How to add a new News post

News posts live in the `_posts` folder. Each post is one file.

### File naming

Post files must be named:

```
YYYY-MM-DD-a-short-title.md
```

For example: `2026-09-20-new-radio-interoperability-grant.md`

The date in the filename controls where the post appears in the
reverse-chronological News list.

### Front matter (the block at the top of the file)

Copy this into a new file and fill it in:

```yaml
---
title: "Your Post Title Here"
date: 2026-09-20 09:00:00 -0500
category: Training
author: Your Name or KLEN Staff
excerpt: >-
  A one to two sentence summary. This is what shows on the News list and
  on the homepage cards.
---
Your article content starts here, written in plain text or Markdown.

## Use headings like this for sections

- Bullet lists work like this
- Second bullet

1. Numbered lists work like this
2. Second item

> Blockquotes (for pull quotes) look like this.
```

`category` should be one of the existing categories (`Training`,
`Legislation`, `Officer Safety`) or a new one you want to introduce &mdash;
new categories automatically show up in the News page's category filter.

### Adding images to a post

1. Put the image file in `assets/images/` (create a subfolder per post if
   you like, e.g. `assets/images/2026-09-radio-grant/photo1.jpg`).
2. Reference it in your post with:
   ```markdown
   ![Description of the image for screen readers]({{ "/assets/images/2026-09-radio-grant/photo1.jpg" | relative_url }})
   ```
   Always include a real description in the brackets &mdash; that text is
   read aloud by screen readers and shown if the image fails to load.

---

## 2. How to add or edit an agency

Agency data lives in two files:

- `_data/agencies.yml` &mdash; every county's sheriff's office plus known
  municipal, campus, and tribal departments. This file powers the
  interactive map, the detail panel, and the full county-by-county list
  on the Agency Information page.
- `_data/state_agencies.yml` &mdash; statewide agencies that aren't tied
  to one county (Kansas Highway Patrol, KBI, and similar). This powers
  the "State & Regional Agencies" section on the same page. Each entry
  has `name`, `note` (a short description shown under the name), and
  `url`.

Both files were built from a mix of standard public reference data and
live web searches on 2026-09-18 (Wikipedia's "List of law enforcement
agencies in Kansas," the Kansas Sheriffs' Association, and municipal
directory sites). Kansas has roughly 360+ law enforcement agencies
statewide, and this file does not claim to list every small-town
department &mdash; see the comment at the top of `_data/agencies.yml` for
what was and wasn't verified, and confirm anything flagged `UNVERIFIED`
before publishing it.

Each county looks like this:

```yaml
- name: "Reno"
  fips: "20155"
  slug: "reno"
  seat: "Hutchinson"
  page: false
  agencies:
    - name: "Reno County Sheriff's Office"
      type: Sheriff
      url: ""
    - name: "Hutchinson Police Department"
      type: Municipal PD
      url: ""
```

**To add an agency to a county:** find that county's entry and add a new
line under `agencies:`, matching the existing format:

```yaml
    - name: "New Agency Name"
      type: Municipal PD
      url: ""
```

`type` should be one of: `Sheriff`, `Municipal PD`, `Campus`, `State`, or
`Other`.

**To edit an agency's name:** just change the text after `name:`.

**Important:** Every field must stay inside quotes if it contains special
characters, and indentation (spaces) must line up exactly like the
example above &mdash; YAML is picky about spacing. If you're not sure,
copy an existing entry and edit it rather than typing a new one from
scratch.

A comment near the top of `_data/agencies.yml` flags which fields
(mostly county seats and smaller-city departments) should be
double-checked before you publish them &mdash; this file was built from
public reference data and general knowledge, not verified directly with
every agency.

---

## 3. How to turn on a county page and fill in its details

By default, **no county has its own page** &mdash; every county in
`_data/agencies.yml` has `page: false`, and agency names show as plain
text (not links) everywhere on the site.

Turning a county's page on takes two steps:

### Step 1: Create the page file

Create a new file at `_agencies/<slug>.md` (use the county's `slug` value
from `_data/agencies.yml`). For Reno County, that's `_agencies/reno.md`.
Its contents should be exactly:

```yaml
---
slug: reno
title: "Reno County"
---
```

(Swap `reno` for your county's actual slug and title.)

### Step 2: Flip the flag

In `_data/agencies.yml`, find that same county's entry and change:

```yaml
  page: false
```

to:

```yaml
  page: true
```

Once both steps are done and the site rebuilds, a new page appears at
`/agencies/<slug>/` listing that county's agencies, and agency names for
that county become clickable links anywhere they appear on the site
(as long as that agency also has a `url` filled in &mdash; see below).

### Filling in contact information and social media

Every generated county page includes two placeholder sections:
**Contact Information** and **Social Media**. These are intentionally
blank until you edit them. Open `_layouts/county.html` if you want to
change the placeholder wording itself, or, for county-specific contact
details and social links, add fields to that county's block in
`_data/agencies.yml` (for example, a `phone`, `address`, or `social`
field) and reference them in `_layouts/county.html`. If you're not
comfortable editing the layout file yourself, list what you'd like added
and a developer can wire it up quickly.

### Adding an agency's website link

Fill in the `url` field for that agency in `_data/agencies.yml`:

```yaml
    - name: "Hutchinson Police Department"
      type: Municipal PD
      url: "https://www.hutchgov.com/166/Police-Department"
```

A link only ever appears if **both** conditions are true: the agency has
a non-empty `url`, **and** that agency's county has `page: true`. This
prevents the site from ever linking to a page that doesn't exist yet.

---

## 4. How to change the contact email

Open `_config.yml` and change this line near the top:

```yaml
contact_email: atcalebbarnhart66@gmail.com
```

That single value controls the mailto address the Contact page uses. No
other files need to change.

---

## 5. How the "From Around the State" external news feed works

The News page has a section, below your own posts, that automatically
links to outside news articles mentioning Kansas law enforcement. KLEN
does not write these &mdash; they're gathered by keyword search and
clearly labeled "External" with a disclaimer, linking out to the
original source rather than reproducing it.

**How it works:** a scheduled GitHub Action (`.github/workflows/fetch-
external-news.yml`) runs once a day, executes `scripts/
fetch_external_news.py` (which searches Google News RSS for a list of
keywords, no API key required), and commits the results to `_data/
external_news.yml`. That commit triggers a normal site rebuild, the same
as any other change.

**This only runs automatically on your default branch** (normally
`main`) &mdash; GitHub does not fire scheduled Actions on other branches.
If nothing is showing up, confirm this workflow has been merged to your
default branch and that Actions are enabled for the repository (Settings
&rarr; Actions).

**To change what it looks for:** open `scripts/fetch_external_news.py`
and edit the `KEYWORDS` list near the top. Each entry is a search phrase
(e.g. `"Kansas sheriff"`); the feed runs every keyword and merges the
results, so you can be as broad or specific as you like.

**To change how often it runs:** edit the `cron` line in `.github/
workflows/fetch-external-news.yml`. It's currently set to once a day.

**To run it manually** (without waiting for the schedule): go to the
repository's **Actions** tab on GitHub, select "Fetch external news,"
and click **Run workflow**.

**To turn it off entirely:** delete `.github/workflows/fetch-external-
news.yml`, or disable the workflow from the Actions tab. The News page
will simply stop showing the section once `_data/external_news.yml` is
empty or removed &mdash; no other changes are needed.

**A note on trust:** this feed is unvetted by design &mdash; it's a
keyword match, not editorial judgment. Don't treat an article showing up
here as KLEN's endorsement of its accuracy. If this concerns you, the
safest change is to have the workflow open a pull request instead of
pushing directly, so a person reviews the list before it goes live; ask
a developer to wire that up if you want it.

---

## 6. How to preview the site locally

You'll need [Ruby](https://www.ruby-lang.org/) installed once. Then, from
this folder:

```bash
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000/KLEN/` in your browser. The site reloads
automatically when you save a file (you may need to refresh the page
manually).

---

## 7. How to publish

This site publishes automatically through GitHub Pages whenever you push
to the `main` branch (or whichever branch your repository's Pages
settings point to).

1. Save your changes.
2. Commit them (in GitHub Desktop, VS Code, or the command line):
   ```bash
   git add .
   git commit -m "Describe what you changed"
   git push
   ```
3. Wait a minute or two &mdash; GitHub automatically rebuilds and
   redeploys the site. You can watch progress under the repository's
   **Actions** tab.

---

## Moving to a custom domain or a `username.github.io` repo

By default this site is set up as a GitHub Pages *project site*, served
at a URL like `https://yourusername.github.io/KLEN/`. If you later:

- Rename this repository to exactly `yourusername.github.io` (making it
  a *user site* served at the domain root), **or**
- Attach a custom domain,

then open `_config.yml` and:

1. Set `baseurl: ""` (an empty string).
2. Update `url:` to your new root address, e.g.
   `https://yourusername.github.io` or `https://www.yourdomain.org`.

Every link on the site is built from those two settings, so this is the
only file you need to change.

---

## Repository structure

```
_config.yml       Site settings (title, URL, plugins, contact email)
_layouts/         Page templates (default, post, county)
_includes/        Reusable HTML snippets (header, footer, the county map)
_sass/            Hand-written CSS, split into partials
assets/           Compiled CSS entry point, JavaScript, images, favicon
_posts/           News articles (see section 1 above)
_data/agencies.yml  All county and agency data (see section 2 above)
_data/external_news.yml  Auto-generated external news links (see section 5)
_agencies/        Generated county pages live here once you turn one on
.github/workflows/fetch-external-news.yml  Daily external news job
scripts/fetch_external_news.py  What that job runs (see section 5)
index.html        Home page
news/index.html   News listing (paginated, with category filtering)
blog.html         Blog placeholder page
agencies/index.html  Agency Information page (map + full directory)
contact.html      Contact form
404.html          Custom "page not found" page
```

## About this site

KLEN is an independent network connecting Kansas law enforcement
professionals. It is not an official government website and is not
affiliated with, operated by, or endorsed by any law enforcement agency
or the State of Kansas.
