{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 24 | trimSuffix "-" -}}
{{- end -}}

{{- define "appname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "appname_with_ref" -}}
{{- printf "%s-%s" (include "appname" .) .Values.biomageCi.ref | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hostname" -}}
{{- if (eq .Values.kubernetes.env "production") -}}
{{- printf "%s.scp.biomage.net" (split "/" .Values.biomageCi.repo)._1 -}}
{{- else -}}
{{- printf "%s.scp-%s.biomage.net" (split "/" .Values.biomageCi.repo)._1 .Values.kubernetes.env -}}
{{- end -}}
{{- end -}}

{{/*
Get SecRule's arguments with unescaped single&double quotes
*/}}
{{- define "secrule" -}}
{{- $operator := .operator | quote | replace "\"" "\\\"" | replace "'" "\\'" -}}
{{- $action := .action | quote | replace "\"" "\\\"" | replace "'" "\\'" -}}
{{- printf "SecRule %s %s %s" .variable $operator $action -}}
{{- end -}}