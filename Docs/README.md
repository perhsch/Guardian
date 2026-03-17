# 🛡️ Guardian Discord Bot



**Guardian** is a comprehensive Discord bot built with Discord.js v14, designed to provide powerful moderation tools, fun interactions, and essential server management features. With an extensive command system and customizable settings, Guardian helps keep your Discord server safe, organized, and entertaining.



**Version:** `1.7.0`  

**License:** Apache 2.0  

**Developer:** Guardians-Stuff



---



## ✨ Features Overview



Guardian offers a wide range of features including:



- **🔨 Moderation Tools** - Ban, kick, warn, timeout, message management, and comprehensive logging

- **⚙️ Administrator Features** - Anti-raid protection, verification systems, auto-roles, ticket system, and more

- **📊 Information Commands** - Server, user, and bot information utilities

- **🔧 Utility Features** - Reminders, AFK status, calculator, and various helpful tools

- **🔄 Backup System** - Create and manage server backups

- **🚀 Sharding Support** - Automatic sharding for large-scale deployments

- **📝 Advanced Logging** - Comprehensive error handling and activity logging

- **📊 Real-time Analytics** - Bot performance monitoring with Statcord integration



---



## 🏗️ Technical Stack



- **Bun** - High-performance JavaScript runtime

- **Discord.js v14.7.1** - Discord API wrapper

- **MongoDB + Mongoose 6.8.1** - Database and ODM

- **Moment.js** - Date/time manipulation

- **Winston** - Advanced logging system

- **tsx** - TypeScript execution



---



## 📋 Prerequisites



Before installing Guardian, make sure you have:



- **Bun** (latest version recommended)

- **MongoDB** database (local or cloud-hosted)

- **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)

- **Git** (for cloning the repository)



---



## 📦 Installation



### Step 1: Clone the Repository



```bash

git clone https://github.com/Guardians-Stuff/Guardian.git

cd Guardian

```



### Step 2: Install Dependencies



```bash

bun install

```



This will install all required packages listed in `package.json`.



### Step 3: Environment Configuration



Create a `.env` file in the root directory with the following variables:



```env

DISCORD_TOKEN=your_discord_bot_token_here

MONGODB_URL=your_mongodb_connection_string_here

LIVE=false

STATCORD_API_KEY=your_statcord_api_key_here

```



**Environment Variables Explained:**



- **`DISCORD_TOKEN`** - Your Discord bot token from the Developer Portal

  - Get it from: https://discord.com/developers/applications

  - Select your application → Bot → Reset Token/Copy Token



- **`MONGODB_URL`** - Your MongoDB connection string

  - Local: `mongodb://localhost:27017/guardian`

  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/guardian`

  - Make sure MongoDB is running if using local instance



- **`LIVE`** - Set to `true` for production with HTTPS, `false` for development

  - When `true`, requires SSL certificates in `data/server/` directory

  - When `false`, uses HTTP on port 2053



- **`STATCORD_API_KEY`** - Your Statcord API key for bot statistics (optional)

  - Get it from: https://statcord.com/

  - Used for tracking bot performance and usage analytics

  - Leave empty if not using Statcord



### Step 4: Optional - SSL Certificates (Production Only)



If running in production mode (`LIVE=true`), place your SSL certificates:



```

data/server/

  ├── privkey.pem    # Private key

  └── fullchain.pem  # Certificate chain

```



---



## 🚀 Running the Bot



### Development Mode



For development with auto-reload:



```bash

bun run dev

```



### Production Mode



For production:



```bash

bun start

```



### Sharded Mode (Recommended for Large Servers)



For automatic sharding:



```bash

bun start

```



### Non-Sharded Mode (Development/Testing)



For development without sharding:



```bash

bun run start-no-shard

```



---



## ⚙️ Configuration

### MongoDB Setup



1. **Local MongoDB:**

   ```bash

   # Install MongoDB on your system

   bun install mongoose

   ```



2. **MongoDB Atlas (Cloud):**

   - Create account at https://www.mongodb.com/cloud/atlas

   - Create a free cluster

   - Get connection string

   - Add your IP to whitelist



### Initial Setup



After the bot is running, use the `/setup` command in your Discord server to:

- Check bot permissions

- Verify bot role position

- Configure logging channels

- Initialize basic settings



---



## 🔧 Development



### Available Scripts



- **`bun start`** - Start the bot in production mode (with sharding)

- **`bun run dev`** - Start the bot in development mode (with sharding and auto-reload)

- **`bun run start-no-shard`** - Start without sharding

- **`bun run dev-no-shard`** - Development without sharding

- **`bun run format`** - Format code using Prettier

- **`bun run check`** - Check code formatting



### Code Formatting



The project uses Prettier for code formatting. To format your code:



```bash

bun run format

```



### Sharding Information



The bot automatically handles sharding for optimal performance:

- **Status Display**: Shows current shard in bot status (e.g., "Shard 1/3")

- **Logging**: All logs include shard information for easy debugging

- **Error Handling**: Shard-specific error reporting to dedicated channels

- **Performance**: Automatic load balancing across shards



### Logging System



Guardian includes comprehensive logging:

- **Console Logs**: Color-coded logs with shard information

- **Error Logs**: Automatic error reporting to Discord channels

- **Activity Logs**: Secret word discoveries and important events

- **Performance Logs**: Bot statistics and health monitoring



---



## 📚 Additional Documentation



- **[INSTALL.md](./INSTALL.md)** - Docker installation guide

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines

- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Code of conduct



---



## 🤝 Contributing



We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:

- Code style guidelines

- How to submit pull requests

- Reporting bugs

- Proposing features



---



## 📄 License



This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.



---



## 🔗 Links



- **GitHub Repository:** [Guardians-Stuff/Guardian](https://github.com/Guardians-Stuff/Guardian)

- **Invite Bot:** [Invite Guardian to your server](https://discord.com/oauth2/authorize?client_id=1469385720270426358&scope=bot)



---



## 🙏 Acknowledgments



- **Developer:** Brennan / Guardians-Stuff

- **Community:** Thanks to all users and contributors who supported Guardian



---



<div align="center">



**⭐ Star this repo if you found it helpful! ⭐**



Made with ❤️ by the Guardian team



</div>

