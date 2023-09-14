#!make
#----------------------------------------
# Settings
#----------------------------------------
.DEFAULT_GOAL := help
#--------------------------------------------------
# Targets
#--------------------------------------------------
install: ## Installs node dependencies
	@npm ci
build: ## Creates a production build
	@npm run build
test: ## Executes unit tests
	@npm run test
check: ## Checks code for linting/construct errors
	@echo "==> Checking if files are well formatted..."
	@npm run lint
	@npm run detect-secrets
	@echo "    [✓]\n"
hooks: ## Configures path to git hooks
	@git config core.hooksPath .githooks
run: ## Runs the UI
	@npm start
.PHONY:install build check run help
clean: ## Cleans up temporary files
	@echo "==> Cleaning up node modules ..."
	@rm -r node_modules
	@echo "    [✓]"
	@echo ""
help: ## Shows available targets
	@fgrep -h "## " $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-13s\033[0m %s\n", $$1, $$2}'
