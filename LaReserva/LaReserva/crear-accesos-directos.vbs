' Crea en el escritorio el acceso directo: La Reserva.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
target = root & "\abrir-la-reserva.vbs"
desktop = shell.SpecialFolders("Desktop")
iconPath = root & "\icon.ico"
If Not fso.FileExists(iconPath) Then
  iconPath = root & "\web\favicon.ico"
End If

linkPath = desktop & "\La Reserva.lnk"
Set lnk = shell.CreateShortcut(linkPath)
lnk.TargetPath = shell.ExpandEnvironmentStrings("%SystemRoot%\System32\wscript.exe")
lnk.Arguments = """" & target & """"
lnk.WorkingDirectory = root
lnk.Description = "Iniciar La Reserva (abre el navegador)"
If fso.FileExists(iconPath) Then
  lnk.IconLocation = iconPath & ",0"
End If
lnk.Save

MsgBox "Acceso directo creado en el escritorio:" & vbCrLf & linkPath & vbCrLf & vbCrLf & "Para celulares: admin - Conexion movil (QR en la app).", vbInformation, "La Reserva"
