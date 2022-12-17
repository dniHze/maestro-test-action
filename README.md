<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# maestro-test-action

A GitHub Action for installing and running [Maestro CLI](https://github.com/mobile-dev-inc/maestro) test flows on iOS/iPadOS Simulator or Android Emulator. Currently, only macOS and Linux hosts are supported.

[Maestro](https://maestro.mobile.dev/) is an awesome tool to kickstart your mobile automation testing with ease. This action helps you setup you maestro and start testing with no bind to the runner OS.

This GitHub Action allows you to automate certain things:

- (macOS only) Install and cache [idb-companion](https://github.com/facebook/idb).
- Select a specific Meastro CLI version, if you want to rollback or just want to be strict.
- Install and cache Maestro CLI.
- Run Maestro flows and generate test reports.
- Set a custom screenshots and recordings path.

> **NOTE**:  If you are just looking to run Maestro tests in Maestro Cloud, please check out the official [mobile-dev-inc/action-maestro-cloud](https://github.com/mobile-dev-inc/action-maestro-cloud) action.

## Usage
### iOS & iPadOS

A worflow that uses **maestro-test-action** to run flows in `.maestro` directory on **iPhone 14 Pro**:

```yaml
jobs:
  test:
    runs-on: macos-12
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'adopt'
          java-version: '11'
      - uses: futureware-tech/simulator-action@v2
        with:
          model: 'iPhone 14 Pro'
      - uses: dniHze/maestro-test-action@v1
        with:
          flow: .maestro
          report: report.xml
```

### Android

A worflow that uses **maestro-test-action** to run flows in `.maestro` directory on **API 29**:

```yaml
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'adopt'
          java-version: '11'
      - uses: dniHze/maestro-test-action@v1
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 29
          arch: x86_64
          ram-size: 2048M
          target: default
          script: maestro test --format=junit --output=report.xml --no-ansi .maestro
```

If you are using [reactivecircus/android-emulator-runner](https://github.com/reactivecircus/android-emulator-runner), it's recommender to use macOS GitHub Hosted runners.
However, if you want to use this project to test your Android app in your private repo, you might as well look into [BuildJet hardware accelerated runners](https://buildjet.com/for-github-actions/blog/hardware-accelerated-android-emulator-on-buildjet-for-github-actions) (*not sponsored*).

## Inputs and ouputs
### Example

```yaml
- uses: dniHze/maestro-test-action@v1
  with:
    env: |
      USERNAME=user@example.com
      PASSWORD=123
    flow: .maestro
    screenshot-dir: screenshots
    report: maestro/report.xml
    version: 1.17.0
```

### Inputs
| Name | Required | Default | Description |
| - | - | - | - |
| `env` | Optional | N/A | Pass custom variables to Maestro flow. Format: `<NAME>=<VALUE>`. Multiple arguments can be separated with multiline. Learn more about Maestro parameters [here](https://maestro.mobile.dev/advanced/parameters-and-constants). |
| `flow` | Optional | N/A | Relative or absolute path to flow or flow directory for batch execution. If not set, **maestro-test-action** will only **setup** Maestro in a job for future invocations. |
| `report` | Optional | N/A | Relative or absolute path to desired report test report location in JUnit format. |
| `screenshots-dir` | Optional | `./maestro/screenshots` | Relative or absolute path to desired screenshot location creation. |
| `version` | Optional | `latest` | Maestro CLI version. If set to `latest`, latest release will be used. All version can be found [here](https://github.com/mobile-dev-inc/maestro/releases). |

### Outputs
| Name |  Description |
| - | - |
| `report` | Absolute path to test report. Output won't be set if `flow` input is empty. Can be used nicely with [test-reporter](https://github.com/dorny/test-reporter) action. |
| `screenshots-dir` | Absolute path to screenshots directory. Output won't be set if `flow` input is empty. Made in mind with [upload-artifact](https://github.com/actions/upload-artifact) action. |

Anything missing? Fill in a [feature request](https://github.com/dniHze/maestro-test-action/issues/new)!

## License

```text
The MIT License (MIT)

Copyright (c) 2022 Artem Dorosh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
