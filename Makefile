init:
	yarn
publish: init
	yarn codegen && yarn build && yarn publish