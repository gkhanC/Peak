@echo off
echo 🚀 Starting Peak Setup...

echo 📦 Installing internal dependencies...
call npm install

echo 🏗️ Building Peak Monorepo...
call npm run build

echo 🔗 Linking Peak CLI...
cd apps\cli
call npm link
cd ..\..

echo ✅ Setup complete!
echo You can now use 'peak' command or run 'npm run dev' to start the web dashboard.
