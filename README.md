
# Tin Can Lan

![Logo](https://media.istockphoto.com/id/999907254/fi/vektori/voi-soittaa.jpg?s=612x612&w=0&k=20&c=RruQgsPT3fG-dPwB8TqcUGQZNd5F5zRbxb8KHQH8Dw8=)

## Overview
This is a small project i have recently started and currently a PoC.

Inspired by the Tin Can telephone, this project is intended for users to silently communicate in close proximity.

It was intended for sharing files between devices. It will operate on a peer-to-peer (P2P) network model, allowing users to connect directly with others who are also using the service.

Current encryption method: **AES-256-CBC**

## Run Locally

Install dependencies

```bash
  npm install
```

Start WebSockets

```bash
  node server.js
```

Run client

```bash
  npm run dev
```

Run on localhost

```bash
  http://localhost:3000/
```
AND

Run on network device

*Simply connect to hosts IP address (port 3000) and start chatting!*

### Inspired by: 
https://snapdrop.net/
