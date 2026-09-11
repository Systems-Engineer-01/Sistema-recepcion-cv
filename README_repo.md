# SIRE-CV · Sistema Integrado de Recepción Electrónica de Currículum Vitae

Plataforma para digitalizar la recepción, ordenamiento y verificación de expedientes (CV) de postulantes a procesos de selección de personal en el sector público (piloto: **Operador Tecnológico** — Concurso de Ascenso de Escala Magisterial 2026), eliminando la exigencia de presentación física en folder manila.

## Por qué existe este proyecto

El comunicado oficial de "Especificaciones para la Entrega y Presentación del CV" exige: folder manila A4, firma y foliado manual con lapicero de tinta azul en cada hoja, copias físicas de título/bachiller/constancias, y entrega presencial en una sede única dentro de un horario fijo. Esto genera:

- **Costos de traslado** para postulantes de zonas alejadas.
- **Papel desperdiciado**: todo el expediente de un postulante descalificado o no apto queda como residuo sin reúso posible (ya firmado y foliado).
- **Cuellos de botella operativos** para quien recepciona: verificación manual, hoja por hoja, del orden A→H y del folio "n/n".

SIRE-CV traslada ese mismo checklist y ese mismo orden documental a un flujo digital con el mismo valor legal, apoyado en el marco de Gobierno Digital del Perú (ver `docs/Sustento_Legal_y_Propuesta.docx`).

## Alcance del piloto (MVP)

1. Registro/autenticación del postulante (DNI + credenciales).
2. Carga de cada documento del checklist (A–H del comunicado) en su propio slot, con validación de formato (PDF, tamaño, orientación vertical).
3. Generación automática de un **Código de Verificación Digital (CVD)** y foliado electrónico equivalente a "1/n" por cada documento, en el orden inverso que exige el comunicado (numeral 6.3).
4. Declaración jurada digital con checkbox + registro de IP/fecha/hora, al amparo del art. 49 del TUO de la Ley 27444.
5. Panel del evaluador/receptor: ver expediente ordenado, marcar cumple/no cumple por rubro, exportar acta.
6. Almacenamiento cifrado en servidor local/institucional (no nube pública) para cumplir el resguardo de datos de la Ley 29733.

## Estructura del repositorio

```
backend/     API (subida de archivos, validación, expedientes, roles)
frontend/    Aplicación web del postulante y del evaluador
docs/        Sustento legal, backlog Scrum, manual de usuario, actas de sprint
.github/     Workflows de CI (lint/test) por sprint
```

## Cómo se construye

Este proyecto se gestiona con **Scrum**: cada Sprint cierra con un commit/tag y un push a este repositorio (ver `docs/Backlog_y_Sprints_Scrum.md`). La implementación de código se ejecuta con **Antigravity + Gemini 3 Pro (High)** a partir de los prompts de sprint documentados en ese mismo archivo; este repositorio y la gestión del backlog son responsabilidad del rol de Gestor de Proyecto (Claude).

## Estado

Sprint 0 — Fundación del proyecto (en curso). Ver `docs/Backlog_y_Sprints_Scrum.md`.
