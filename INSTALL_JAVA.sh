#!/bin/bash

echo "🔧 Installing Java for Android APK Build..."
echo ""

# Check if Homebrew is installed
if command -v brew &> /dev/null; then
    echo "✅ Homebrew is installed"
    
    # Install Java 17
    echo "📦 Installing Java 17..."
    brew install openjdk@17
    
    # Set JAVA_HOME
    echo "🔧 Setting JAVA_HOME..."
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)
    
    # Add to shell profile
    echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
    
    echo ""
    echo "✅ Java installed successfully!"
    echo ""
    echo "🔍 Java version:"
    java -version
    
    echo ""
    echo "🚀 Now you can build your APK:"
    echo "   npm run apk:debug"
    
else
    echo "❌ Homebrew is not installed yet"
    echo ""
    echo "Please wait for Homebrew installation to complete in your terminal,"
    echo "then run this script again:"
    echo "   chmod +x INSTALL_JAVA.sh && ./INSTALL_JAVA.sh"
    echo ""
    echo "OR download Java manually from:"
    echo "   https://adoptium.net/temurin/releases/"
fi

