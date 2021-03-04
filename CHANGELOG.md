# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

### [2.0.1-beta.3](https://github.com/dzhelezov/hydra/compare/v2.0.1-beta.2...v2.0.1-beta.3) (2021-03-04)


### Bug Fixes

* test fix ([8569581](https://github.com/dzhelezov/hydra/commit/85695816271976adf23134312415130570813b92))
* test fix ([62138ae](https://github.com/dzhelezov/hydra/commit/62138ae4af959290ea9f7323eeaaaf057d79d576))
* **hydra-cli:** test fix ([a3d9757](https://github.com/dzhelezov/hydra/commit/a3d9757bc9dcebb5058db57831215bd45b6c400f))



# [](https://github.com/dzhelezov/hydra/compare/v2.0.1-beta.2...v) (2021-03-04)

## [0.1.2](https://github.com/dzhelezov/hydra/compare/v0.0.4...v0.1.2) (2020-11-16)



## [0.0.4](https://github.com/dzhelezov/hydra/compare/v0.0.17...v0.0.4) (2020-11-06)



## [0.0.17](https://github.com/dzhelezov/hydra/compare/v0.0.18-alpha.2...v0.0.17) (2020-11-02)



## [0.0.18-alpha.2](https://github.com/dzhelezov/hydra/compare/v0.0.18-alpha.1...v0.0.18-alpha.2) (2020-10-29)



## [0.0.18-alpha.1](https://github.com/dzhelezov/hydra/compare/v0.0.16-alpha.2...v0.0.18-alpha.1) (2020-10-29)



## [0.0.16-alpha.2](https://github.com/dzhelezov/hydra/compare/42411380733fddf8909824c9ea6a6ab7939af74c...v0.0.16-alpha.2) (2020-10-19)


### Bug Fixes

* add guard for event data ([52db9aa](https://github.com/dzhelezov/hydra/commit/52db9aa401c0b913e3e6531496c316a761b69c1d))
* add guard for related field isList to decide 1:n ([d6d4c8f](https://github.com/dzhelezov/hydra/commit/d6d4c8f78cc60b873067be99d270371440134756))
* allow block height only if database is empty ([19b50a0](https://github.com/dzhelezov/hydra/commit/19b50a0fdbb9242a2cabef675397588ef4d8be3d))
* always override BLOCK_HEIGHT env var ([2d003f2](https://github.com/dzhelezov/hydra/commit/2d003f2c2b3105e569a84d25956c6699a46c868b))
* continue with the next block if fail to fetch events ([867bb28](https://github.com/dzhelezov/hydra/commit/867bb28eb783fd3b28f46858bc7000377ea3baad))
* import NumericField for BigDecimal type ([6740e8c](https://github.com/dzhelezov/hydra/commit/6740e8c286b4fe5b2a1720b49ec168f807200c69))
* imports ([ed22c71](https://github.com/dzhelezov/hydra/commit/ed22c71f75b1fa4430989c5240bb9dccc011b308))
* missing related entity imports ([c879782](https://github.com/dzhelezov/hydra/commit/c8797823ac2b879ba95e032603947e974c7b75fe))
* processing a block events in one db transcation ([691d37f](https://github.com/dzhelezov/hydra/commit/691d37f763bb5ba68f0faef3fc158dab4b2fa8ba))
* provide object type in @Resolver decorator ([59b9d49](https://github.com/dzhelezov/hydra/commit/59b9d49604223de495ef262787e1db794a816b8e))
* set join props for m-t-m JoinTable decorator ([4b25c02](https://github.com/dzhelezov/hydra/commit/4b25c029a4018a5b6884d9d89cc1e0b381b419b3))
* use bn.js for numeric types ([faafa83](https://github.com/dzhelezov/hydra/commit/faafa83b9c65ceeb9598f906cc4abf200134ea67))
* **indexer:** add guard for required entity fields ([df7570a](https://github.com/dzhelezov/hydra/commit/df7570a14394e5be5344997c20540d4a6911bcc5))
* **indexer:** introduce asyncForEach to support async/await in foreach ([d6f84e8](https://github.com/dzhelezov/hydra/commit/d6f84e88fc5207e09c585fd7514567371eaa05af))
* **indexer:** load warthog env vars for db models ([9d96757](https://github.com/dzhelezov/hydra/commit/9d96757c75c16492c3a082c654546deaf9a899fc))
* **indexer:** use db lock mode to prevent multiple records in last processed event table ([91fe1dd](https://github.com/dzhelezov/hydra/commit/91fe1ddb35f5f6cefd9b472b297f1c973acb5e09))


### Features

* make entity fields unique on database with [@unique](https://github.com/unique) directive ([d740010](https://github.com/dzhelezov/hydra/commit/d740010339bd28c3990ab24c59785d512875185e))
* propagate descriptions in the input schema model classes ([299c64c](https://github.com/dzhelezov/hydra/commit/299c64cd0b8b23d89421958cbdb7c60434770807))
* **cli:** add option to generate api preview ([4241138](https://github.com/dzhelezov/hydra/commit/42411380733fddf8909824c9ea6a6ab7939af74c))
* **indexer:** add getMany to return multiple result from db ([d1049aa](https://github.com/dzhelezov/hydra/commit/d1049aa181221dd786aa41ed3a54b184bd89c131))
* **mappings:** add handlers for avatar and handle ([a99a0da](https://github.com/dzhelezov/hydra/commit/a99a0da67606a388105a180a844b353f410f33cb))
* **mappings:** add mappings for rootAccount, controllerAccount ([652763e](https://github.com/dzhelezov/hydra/commit/652763e597415d9616086ed72d504366e0e2a20b))
