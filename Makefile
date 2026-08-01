up:        ## Поднять контейнеры в фоне
	docker compose up -d

down:      ## Остановить и удалить контейнеры
	docker compose down

restart:   ## Перезапустить контейнеры (down + up)
	docker compose down && docker compose up -d

encrypt:   ## Зашифровать .env -> .vault (интерактивный prompt пароля)
	@command -v ansible-vault >/dev/null 2>&1 || { echo "ansible-vault not installed. Install: brew install ansible"; exit 1; }
	@test -f .env || { echo ".env not found"; exit 1; }
	@rm -f .vault
	@ansible-vault encrypt .env --output=.vault
	@chmod 600 .vault
	@echo "Encrypted .env -> .vault"

decrypt:   ## Расшифровать .vault -> .env (интерактивный prompt пароля)
	@command -v ansible-vault >/dev/null 2>&1 || { echo "ansible-vault not installed. Install: brew install ansible"; exit 1; }
	@test -f .vault || { echo ".vault not found"; exit 1; }
	@ansible-vault decrypt .vault --output=.env
	@chmod 600 .env
	@echo "Decrypted .vault -> .env"

help:      ## Показать список целей
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'