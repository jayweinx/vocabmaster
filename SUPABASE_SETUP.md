# Supabase setup for VocabMaster

You only need to do this once. Students never need Supabase accounts.

## 1. Create the Supabase project

1. Open [supabase.com](https://supabase.com/) and sign in.
2. Click **New project**.
3. Choose your organisation, enter a project name such as `VocabMaster`, create a strong database password, and choose the nearest region.
4. Click **Create new project** and wait until the project is ready.

## 2. Create the database tables and security rules

1. In the Supabase left sidebar, click **SQL Editor**.
2. Click **New query**.
3. In this GitHub repository, open `supabase/schema.sql` and copy the entire file.
4. Paste it into the Supabase query editor.
5. Click **Run**. A successful run should show “Success. No rows returned”.

The SQL allows everyone to read folders and words, but only teacher user IDs in the allowlist can add, edit, or delete them. Never put a `service_role` key in VocabMaster or in GitHub Pages settings.

## 3. Create your teacher login

1. In the Supabase left sidebar, click **Authentication** and then **Users**.
2. Click **Add user**, then **Create new user**.
3. Enter the email and password you want to use for VocabMaster.
4. Turn on **Auto Confirm User**, then click **Create user**.
5. In the user list, click the new user and copy the **User UID**. It looks like `12345678-abcd-...`.
6. Return to **SQL Editor** and run this line after replacing the sample value with the UID you copied:

```sql
insert into public.teacher_users (user_id)
values ('PASTE-YOUR-TEACHER-USER-UID-HERE')
on conflict (user_id) do nothing;
```

To prevent public student signup, open **Authentication → Sign In / Providers → Email**. Turn off **Allow new users to sign up** (the wording may appear as **Enable email signups**) and save. Your manually created teacher account will still work.

## 4. Copy the two safe frontend values

1. In Supabase, click **Project Settings** (gear icon), then **API**.
2. Copy the **Project URL**.
3. Copy the **anon public** key. In newer Supabase screens this may be labelled **Publishable key**. Do not copy the `service_role` or secret key.

For local development, copy `.env.example` to a new file named `.env.local`, then replace its sample values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

`.env.local` is ignored by Git and must not be committed.

## 5. Add the values to GitHub Pages

1. Open the `jayweinx/vocabmaster` repository on GitHub.
2. Click **Settings → Secrets and variables → Actions**.
3. Open the **Variables** tab, click **New repository variable**, name it `VITE_SUPABASE_URL`, paste the Project URL, and save.
4. Open the **Secrets** tab, click **New repository secret**, name it `VITE_SUPABASE_ANON_KEY`, paste the anon/publishable key, and save.
5. Click **Actions → Deploy GitHub Pages → Run workflow → Run workflow**. A normal push to `main` also deploys automatically.
6. Wait for the green check mark, then open `https://jayweinx.github.io/vocabmaster/`.

The anon/publishable key is designed to be used in a browser. The Row Level Security rules in `schema.sql` are what prevent student writes.

## 6. Publish your existing browser library

Do this in the same browser that currently contains your vocabulary:

1. Open the newly deployed VocabMaster site.
2. Click **Teacher Login** and sign in with the teacher email and password you created.
3. Click **Publish Local Library to Cloud**.
4. Review the folder and word counts, then click **Publish to Cloud**.
5. Wait for the success message. Do not close the tab while it says **Saving to cloud…**.

This preserves your existing IDs, folder hierarchy, word metadata, and JSON backup tools. It does not automatically upload anything until you confirm.

## 7. Test student access

1. Sign out of teacher mode.
2. Open a private/incognito window or a different browser.
3. Visit `https://jayweinx.github.io/vocabmaster/`.
4. Confirm that the folders and words appear without login and that Teacher Input/Manage Words are absent.
5. In teacher mode, use **Copy Share Link** on a folder. Paste that link into the private window and confirm it opens that folder directly.

Student names, flashcard status, quizzes, spelling, and Adventure progress remain only on each student's device.

## Troubleshooting

- **“Cloud setup required”** means one or both GitHub environment values are missing or the site has not been rebuilt since they were added.
- **Teacher login works but teacher tools stay locked** means the login user's UID was not inserted into `teacher_users`.
- **Cloud load failed** usually means the SQL was not run, the URL/key was copied incorrectly, or Supabase is temporarily unavailable. VocabMaster uses its last successful cloud cache when one exists and shows the error instead of replacing the library with an empty browser library.
- If a teacher edit cannot be saved, VocabMaster shows the cloud error and a **Retry Save** button.
