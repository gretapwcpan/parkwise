# Makefile for Parking Space Prototype

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
NC = \033[0m # No Color

# Default target
.PHONY: all
all: install

# Install all dependencies
.PHONY: install
install:
	@echo "$(GREEN)Installing all dependencies...$(NC)"
	@$(MAKE) install-backend
	@$(MAKE) install-frontend
	@echo "$(GREEN)All dependencies installed!$(NC)"

# Install individual components
.PHONY: install-backend
install-backend:
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && npm install

.PHONY: install-frontend
install-frontend:
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install

# Run all services
.PHONY: dev
dev:
	@echo "$(GREEN)Starting all services...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@npm run dev

# Run individual services
.PHONY: dev-backend
dev-backend:
	@cd $(BACKEND_DIR) && npm start

.PHONY: dev-frontend
dev-frontend:
	@cd $(FRONTEND_DIR) && npm start

# Build production
.PHONY: build
build:
	@echo "$(GREEN)Building production assets...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Build complete!$(NC)"

# Clean everything
.PHONY: clean
clean:
	@echo "$(YELLOW)Cleaning all node_modules and build directories...$(NC)"
	@rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/package-lock.json
	@rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/package-lock.json $(FRONTEND_DIR)/build
	@rm -rf node_modules package-lock.json
	@echo "$(GREEN)Clean complete!$(NC)"

# Setup environment
.PHONY: setup
setup:
	@echo "$(GREEN)Setting up environment...$(NC)"
	@cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env
	@echo "$(YELLOW)Created .env file in backend/$(NC)"
	@echo "$(YELLOW)Please edit backend/.env and add your configuration$(NC)"

# Quick start (install + setup + run)
.PHONY: quickstart
quickstart: install setup
	@echo "$(GREEN)Quick start complete! Now run 'make dev' to start all services$(NC)"

# Help
.PHONY: help
help:
	@echo "$(GREEN)Parking Space Prototype - Makefile Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup & Installation:$(NC)"
	@echo "  make install      - Install all dependencies"
	@echo "  make setup        - Create .env file from example"
	@echo "  make quickstart   - Install + setup (recommended for first time)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev          - Run all services concurrently"
	@echo "  make dev-backend  - Run only backend"
	@echo "  make dev-frontend - Run only frontend"
	@echo ""
	@echo "$(YELLOW)Production:$(NC)"
	@echo "  make build        - Build frontend for production"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(NC)"
	@echo "  make clean        - Remove all node_modules and builds"
	@echo ""
	@echo "$(YELLOW)Individual Installs:$(NC)"
	@echo "  make install-backend"
	@echo "  make install-frontend"
