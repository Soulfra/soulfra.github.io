#!/bin/bash
#
# StPetePros Quick Launcher
#
# Your "control panel" for all StPetePros tools
#

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_menu() {
    clear
    echo ""
    echo "=============================================="
    echo "  StPetePros Control Panel"
    echo "=============================================="
    echo ""
    echo "  1) 📊 Workflow Status (dev/staging/prod)"
    echo "  2) 🔄 Start Auto-Deploy (Dropbox-style)"
    echo "  3) 🌐 Start Public Backend (your laptop = server)"
    echo "  4) 📧 Email Batch Processor"
    echo "  5) 🚀 Deploy Now (git push)"
    echo "  6) 👀 View Live Site"
    echo "  7) 📝 Edit signup.html"
    echo ""
    echo "  q) Quit"
    echo ""
    echo -n "Choose option: "
}

while true; do
    show_menu
    read choice

    case $choice in
        1)
            echo ""
            python3 workflow-status.py
            echo ""
            read -p "Press Enter to continue..."
            ;;
        2)
            echo ""
            echo -e "${GREEN}🔄 Starting Auto-Deploy...${NC}"
            echo ""
            echo "Edit any file in stpetepros/ → auto-deploys to GitHub Pages"
            echo "Stop with: Ctrl+C"
            echo ""
            python3 auto-deploy.py
            ;;
        3)
            echo ""
            echo -e "${GREEN}🌐 Starting Public Backend...${NC}"
            echo ""
            cd ~/Desktop/roommate-chat/soulfra-simple
            ./start-public-backend.sh
            cd - > /dev/null
            ;;
        4)
            echo ""
            echo -e "${GREEN}📧 Email Batch Processor${NC}"
            echo ""
            cd ~/Desktop/roommate-chat/soulfra-simple
            python3 email-batch-processor.py
            cd - > /dev/null
            echo ""
            read -p "Press Enter to continue..."
            ;;
        5)
            echo ""
            echo -e "${GREEN}🚀 Deploying to GitHub Pages...${NC}"
            echo ""
            git add stpetepros/
            echo "Files staged:"
            git status --short stpetepros/
            echo ""
            read -p "Commit message: " msg
            if [ -n "$msg" ]; then
                git commit -m "$msg"
                git push
                echo ""
                echo -e "${GREEN}✅ Deployed! Live in 30 seconds.${NC}"
                echo "   https://soulfra.github.io/stpetepros/"
            else
                echo "Cancelled."
            fi
            echo ""
            read -p "Press Enter to continue..."
            ;;
        6)
            echo ""
            echo -e "${BLUE}👀 Opening live site...${NC}"
            open https://soulfra.github.io/stpetepros/
            sleep 1
            ;;
        7)
            echo ""
            echo -e "${BLUE}📝 Opening signup.html in nano...${NC}"
            echo ""
            nano stpetepros/signup.html
            ;;
        q|Q)
            echo ""
            echo "Bye!"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo -e "${YELLOW}Invalid option${NC}"
            sleep 1
            ;;
    esac
done
