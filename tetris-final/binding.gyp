{
  "targets": [
    {
      "target_name": "tetris_core",
      "sources": [
        "native/tetris_core.cpp",
        "native/addon.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "native"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "configurations": {
        "Release": {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "RuntimeLibrary": 2
            }
          }
        },
        "Debug": {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "RuntimeLibrary": 3
            }
          }
        }
      },
      "conditions": [
        ["OS=='win'", {
          "defines": ["_WINDOWS"]
        }]
      ]
    }
  ]
}