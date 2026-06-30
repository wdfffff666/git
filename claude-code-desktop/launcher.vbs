' Claude Code Desktop Launcher
' No CMD window, runs Electron directly

Set fso = CreateObject("Scripting.FileSystemObject")
Set ws = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Build path to electron.exe
electronExe = scriptDir & "\node_modules\electron\dist\electron.exe"

' Run Electron, window style 1 = normal, wait=false (async)
ws.Run """" & electronExe & """ .", 1, False
