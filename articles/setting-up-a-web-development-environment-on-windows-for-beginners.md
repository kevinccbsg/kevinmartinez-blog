---
title: Setting Up a Web Development Environment on Windows
description: >-
  If you're just starting out in web development and using a Windows machine,
  this guide will walk you through the essential setup to get productive
  quickly.
date: '2025-06-30'
tags:
  - webdev
  - programming
  - beginners
  - learning
devto_url: >-
  https://dev.to/kevinccbsg/setting-up-a-web-development-environment-on-windows-for-beginners-1m8d
---
If you're just starting out in web development and using a Windows machine, this guide will walk you through the essential setup to get productive quickly.

This guide covers what I believe are the most essential tools and configurations for beginners working with Windows:

1. Install your favorite browser  
2. Use a better Windows terminal  
3. Enable and install WSL (Windows Subsystem for Linux)  
4. Configure the default terminal profile  
5. Install Oh My Zsh  
6. Install NVM and Node.js  
7. Set up SSH keys for GitHub  
8. Test your SSH connection  
9. Install VS Code or your favorite editor  
10. Install Docker Desktop

---

## 1. Install your favorite browser

First step is easy: just install your favorite browser—Chrome, Edge, Safari, Opera, Brave—whatever you feel comfortable using and offers developer tools you like.

## 2. Use a better Windows terminal

If you're on Windows, you might know CMD or Git Bash. They're okay, but I highly recommend [Windows Terminal](https://apps.microsoft.com/detail/9n0dx20hk701?hl=en-US&gl=US). In newer versions of Windows, it might already be installed, and if not, you can download it from the Microsoft Store.

> If you're using another terminal and everything else works fine, feel free to keep using it. If not, consider switching.

## 3. Enable and Install WSL (Windows Subsystem for Linux)

Once you open Windows Terminal, it defaults to PowerShell. Use it to [install WSL](https://learn.microsoft.com/en-us/windows/wsl/install#install-wsl-command):

```bash
wsl --install
```

This installs Ubuntu by default and will prompt you to create a username and password. When typing the password, nothing will appear (no `*`), but it's being typed. Use a secure password—you’ll need it later.

Once installation is complete, restart your computer.

## 4. Configure the default terminal

After restarting, Windows Terminal will still open in PowerShell. Let’s change the default profile.

Open the settings panel:

![terminal options](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9w9rwklwbw6oc8x0w7ve.png)

And set **Ubuntu** as your default profile:

![configuration profile options](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xzhox5dmg3xz4xh6xtvz.png)

You’re now ready to use the Ubuntu terminal!

To navigate easily to your current folder in the Windows file explorer, use:

```bash
explorer.exe .
```

You’ll also find your Linux files under this path:


![Linux folder](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/av69ng1x0kvdoduolfzw.png)


## 5. Install Oh My Zsh

Install zsh and [oh-my-zsh](https://ohmyz.sh/) to improve your terminal experience:

```
sudo apt update
sudo apt install zsh
```
> You'll be prompted to enter your Ubuntu user password and confirm with `Y`.

Then install `Oh-My-Zsh`:

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

With this, you'll get tab completion, Git status indicators, and an overall better UX:

![oh-my-zsh example](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f0dogja179ip4j37he74.png)

## 6. Install NVM and Node.js

There are many ways to install Node.js, but the most professional one is using a version manager like [Nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating). Sometimes you’ll need to switch between Node versions for different projects.

To install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

If `nvm` isn’t recognized, just **restart your terminal**.

Then install the latest [LTS](https://en.wikipedia.org/wiki/Long-term_support) (Long-Term Support) version:

```bash
nvm install --lts
```

> Always use the LTS version unless a project requires something else. You can check [Node.js releases](https://nodejs.org/en/about/previous-releases) for more info.

## 7. Set Up SSH Keys for GitHub

To clone, pull, and push code from your GitHub account securely, it's better to use SSH instead of HTTPS.

Generate a new SSH key:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

You'll be prompted to enter a path and passphrase. You can leave both blank if you prefer:

```bash
> Enter file in which to save the key (/home/your_user/.ssh/id_your_key):[Press enter]
> Enter passphrase (empty for no passphrase): [Type a passphrase]
> Enter same passphrase again: [Type passphrase again]
```

Then, follow [this guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) to add the public key (id_your_key.pub) to your GitHub account.

## 8. Test Your SSH Connection to GitHub

Clone a test repository to make sure your SSH setup works:

```
git clone git@github.com:kevinccbsg/react-router-tutorial-devto.git
```

If this appears:


```bash
> The authenticity of host 'github.com (IP ADDRESS)' can't be established.
> ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
> Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and hit Enter.

If you get a **“Permission denied (publickey)”** error, run:

```bash
eval $(ssh-agent)
ssh-add /home/your_user/.ssh/id_your_key
```

To avoid doing this every time, add these lines to your `~/.zshrc` file.

Also, don’t forget to set your Git user details globally:

```bash
git config --global user.name "your name"
git config --global user.email "your_email@example.com"
```

## 9. Install VS Code or your favorite code editor

Now install your code editor of choice. I recommend [VS Code](https://learn.microsoft.com/es-es/windows/wsl/tutorials/wsl-vscode#install-vs-code-and-the-wsl-extension) for beginners.

Make sure you check the "Add to PATH" option during installation so you can launch it with:

```bash
code .
```

This allows you to open folders directly inside WSL.

## 10. Install Docker Desktop for Windows

> If you're not familiar with Docker yet, you can skip this step for now.

Docker is useful for backend and full-stack projects. [Install Docker Desktop](https://www.docker.com/get-started/) and [enable WSL integration](https://learn.microsoft.com/es-es/windows/wsl/tutorials/wsl-containers#install-docker-desktop).

---

## Conclusion

By now, you’ve set up a modern and efficient development environment that combines the power of Linux with the comfort of Windows.
