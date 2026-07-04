' Compatibilidad: nombre anterior del instalador de accesos directos.
CreateObject("WScript.Shell").Run """" & Replace(WScript.ScriptFullName, "crear-acceso-directo.vbs", "crear-accesos-directos.vbs") & """", 1, False
