.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help: ## List all targets
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	@git config core.hooksPath .githooks
	@chmod +x .githooks/* scripts/smoke.sh
	@echo "Git hooks installed from .githooks"

dev: ## Run the frontend dev server
	@npm run dev

build: ## Build the GitHub Pages artifact into docs/
	@npm run build

data: ## Mode A has no data pipeline
	@echo "Mode A: no static data pipeline is required."

test: ## Run unit tests
	@npm test

test-integration: ## Run integration tests
	@echo "Mode A: no separate integration suite yet."

smoke: ## Build, serve docs/, and run Playwright smoke tests
	@npm run smoke

lint: ## Run linters, format checks, and TypeScript checks
	@npm run lint

fmt: ## Autoformat source files
	@npm run fmt

pages-preview: build ## Serve docs/ locally as GitHub Pages would
	@npx vite preview --host 127.0.0.1 --port 4173

docker-build: ## Mode A has no Docker image
	@echo "Mode A: Docker is intentionally absent."

docker-push: ## Mode A has no Docker image
	@echo "Mode A: Docker is intentionally absent."

release: build test smoke ## Tag a semver release, e.g. make release VERSION=v0.1.0
	@test -n "$(VERSION)" || (echo "Set VERSION=vX.Y.Z" && exit 1)
	@git tag "$(VERSION)"
	@git push origin "$(VERSION)"

compose-up: ## Mode A has no compose stack
	@echo "Mode A: no compose stack is required."

compose-down: ## Mode A has no compose stack
	@echo "Mode A: no compose stack is required."

clean: ## Remove local build and test artifacts
	@rm -rf coverage tmp test-results playwright-report node_modules/.tmp

hooks-pre-commit: ## Run pre-commit hook manually
	@.githooks/pre-commit

hooks-commit-msg: ## Run commit-msg hook manually with MSG=.git/COMMIT_EDITMSG
	@test -n "$(MSG)" || (echo "Set MSG=<commit message file>" && exit 1)
	@.githooks/commit-msg "$(MSG)"

hooks-pre-push: ## Run pre-push hook manually
	@.githooks/pre-push
