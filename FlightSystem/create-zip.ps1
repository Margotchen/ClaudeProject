$docs = '01-PRD文档','02-技术方案','03-测试报告','04-AI对话记录'
Compress-Archive -Path $docs -DestinationPath FlightSystem.zip -Force
$src = Get-ChildItem -Path '05-项目源代码' -Exclude node_modules,dist,.claude,.git
Compress-Archive -Path $src -DestinationPath FlightSystem.zip -Update
