@echo off

:: Ensure we are in the project root
cd /d "%~dp0\.."

echo 🚀 Starting Peak Setup...

echo 📦 Installing internal dependencies...
call npm install

echo 🏗️ Building Peak Monorepo...
call npm run build

echo 🔗 Linking Peak CLI...
cd apps\cli
call npm install -g .
cd ..\..

echo ⚙️ Saving Peak configuration...
echo {"projectRoot": "%CD:\=\\%"} > "%USERPROFILE%\.peak-config.json"

echo 🖥️  Creating Desktop Shortcut...
call node apps\cli\dist\index.js create-shortcut

echo ✅ Setup complete!
echo You can now use 'peak' command or run 'npm run dev' to start the web dashboard.
