# Cheminformatics Virtual Laboratory Modernization & Enhancement Plan

A comprehensive architectural and UX modernization plan transforming the Python Streamlit Cheminformatics Virtual Laboratory (SRM Institute of Science and Technology, Tiruchirappalli — Division of Chemistry) into a high-performance, publication-grade web laboratory application with interactive 2D structure sketching, 3D molecular exploration, drug-likeness evaluation, and student lab report generation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during interactive clarification and govern the system design:
>
> - **Confirmed Scope & Features**: All 4 requested high-impact enhancements are included: (1) Interactive 2D chemical sketcher and 3D molecular studio, (2) Drug-likeness screening and Lipinski Rule of 5 / Veber evaluation, (3) Expanded student lab reports with downloadable and printable PDF export, and (4) Interactive assessment mode with pedagogical hints and detailed explanations.
> - **Confirmed Visual Aesthetic**: Styled with a **mild color palette** — gentle academic slate (`#F8FAFC`), crisp white structural cards (`#FFFFFF`), subtle borders (`#E2E8F0`), soft muted cobalt/slate primary accents (`#2563EB` / `#334155`), and gentle semantic tones (soft sage green, muted amber) avoiding harsh neon or intense contrast.
> - **Institutional Alignment**: Full preservation and prominent display of SRM Institute of Science and Technology institutional affiliation and faculty attribution (Dr. R. Subramanian, Division of Chemistry).

---

## 1. Overview & Core Concept

### What It Does
The modernized **Cheminformatics Virtual Laboratory** is a comprehensive educational and scientific workbench where students and researchers can:
1. **Input & Sketch**: Enter SMILES text, choose curated textbook presets, or visually construct chemical structures using an interactive 2D molecular drawing canvas.
2. **Visualize in 2D & 3D**: Render high-clarity 2D chemical diagrams (SmilesDrawer) and interactive WebGL 3D molecular structures (3Dmol.js) with customizable representation models (Ball & Stick, Stick, Space-Filling, Wireframe, van der Waals surface).
3. **Analyze Physicochemical Properties & Bonds**: Calculate detailed molecular descriptors, exact mass, polar surface area (TPSA), and full σ/π bond partitioning with aromatic Kekulé resolution.
4. **Evaluate Drug-Likeness**: Benchmark molecules against **Lipinski's Rule of 5** and **Veber's Bioavailability Criteria** with interactive compliance gauges and radar charts.
5. **Compare Compound Libraries**: Run multi-molecule batch comparisons with interactive scatter/radar charts and CSV data export.
6. **Learn with Guided Assessments**: Practice cheminformatics concepts with multiple-choice questions featuring progressive hints, detailed explanations, and instant feedback.
7. **Generate Student Lab Reports**: Compile student details (Name, Registration Number), 2D/3D structure figures, detailed descriptor tables, student interpretations, and educational Python/RDKit code into a single downloadable PDF document.

### Target Audience & Persona
- **Undergraduate & Postgraduate Chemistry & Biotechnology Students**: Learning cheminformatics, structural representations, and molecular properties without requiring local Python/RDKit installations.
- **Instructors & Lab Coordinators**: Assigning homework, assessing structural literacy, and evaluating standardized laboratory PDF submissions.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme (Mild Academic Palette)
- **Palette Composition (60-30-10 discipline)**:
  - **60% Primary Canvas**: Soft lab slate `#F8FAFC` and crisp `#FFFFFF` background.
  - **30% Structural Surfaces**: Clean white `#FFFFFF` surface cards with subtle hairline borders (`#E2E8F0` / `#E5E7EB`), light grey table alternating zebra stripes (`#F1F5F9`), and mild muted header bands (`#1E3A8A` dark sapphire for institutional branding).
  - **10% Calibrated Mild Accents**: Muted scientific cobalt (`#2563EB`), gentle sage green (`#059669` / `#10B981`) for passing rules and correct answers, and soft amber (`#D97706`) for cautionary descriptor boundaries.
- **Typography & Scale**:
  - Headings & Brand: *Plus Jakarta Sans* or clean neo-grotesque sans-serif with balanced measure (`text-wrap: balance`).
  - Data & SMILES: `font-mono tabular-nums` for precise molecular formulas, SMILES notations, bond counts, and numeric descriptor readouts.
  - No low-opacity watermark text, no decorative pulsing dots, and no capsule badge sandwiches.

### Layout & Top Bar Contract
- **Top Navigation Bar (1-row, 3-zone contract)**:
  - **Zone 1 (Brand)**: Single text element `Cheminformatics Virtual Laboratory` with institutional subtitle in hero banner.
  - **Zone 2 (Navigation Tabs)**: Clean single-line links (`Overview`, `2D/3D Studio`, `Properties & Drug-Likeness`, `Structure Comparison`, `Assessment`, `Lab Report`).
  - **Zone 3 (Action)**: Quick student ID indicator / Reset session button.
- **Workspace Navigation**:
  - Tabbed or sidebar navigation mirroring the original 7 laboratory modules while eliminating page reload latencies and supporting real-time reactivity.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Chemistry Calculation & Visualization Architecture
- **Chosen Approach**:
  - Client-side rendering for 2D structures using `smiles-drawer` and HTML5 Canvas.
  - Client-side WebGL 3D molecular viewer using `3Dmol.js` with dynamic 3D coordinate generation (using RDKit/AllChem ETKDG coordinates or PubChem PUG REST 3D conformer service for real compounds).
  - Client-side + Node/Express server proxy for comprehensive chemical descriptor calculations, ensuring instant offline-capable interaction while accessing PubChem/ChEMBL when online.
- **Why**: Eliminates heavy Python Streamlit server container cold starts, provides 60 FPS 3D interaction, and guarantees consistent rendering across student laptops and tablets.
- **Alternatives Considered**: Direct Streamlit iframe embedding (discarded due to slow execution, iframe scaling glitches, and inability to integrate interactive 2D sketchers).

### Decision 2: 2D Chemical Sketcher Integration
- **Chosen Approach**: Provide both standard text SMILES input with instant example pills, plus an interactive canvas-based 2D chemical structure drawing tool (atom picker, bond drawer, ring presets) that generates clean SMILES dynamically.
- **Why**: Enables students who don't yet know SMILES syntax to build molecules visually and immediately see how SMILES translates to structure.

### Decision 3: Comprehensive Report Generation (PDF & Print)
- **Chosen Approach**: High-fidelity browser-native vector PDF generation via HTML5 canvas image export and `@media print` styling, plus a client-side jsPDF/ReportLab-compatible download flow.
- **Why**: Allows instant generation of multi-page lab reports with high-resolution 2D diagrams, 3D snapshots, and formatted tables with student credentials.

---

## 4. Technical Architecture & Component Hierarchy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Top Navigation & Institutional Bar                   │
│         SRM Institute of Science and Technology · Division of Chemistry│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Shared Molecule State & Presets Bar                  │
│  [Ethanol] [Benzene] [Phenol] [Acetic Acid] [Aspirin] [Caffeine] [...] │
│  Active SMILES Input / 2D Chemical Sketcher Toggle                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  2D & 3D Studio  │      │ Properties &     │      │ Multi-Molecule   │
│  - SmilesDrawer  │      │ Drug-Likeness    │      │ Comparator       │
│  - 3Dmol.js WebGL│      │ - Descriptors    │      │ - Batch Table    │
│  - Styles: Ball/ │      │ - σ/π Bond Info  │      │ - Metric Curves  │
│    Stick/Surface │      │ - Lipinski Ro5   │      │ - CSV/PDF Export │
│  - Camera HUD    │      │ - Veber Rules    │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────────┐        ┌──────────────────────────┐
│ Interactive Assessment Mode      │        │ Final Lab Report Engine  │
│ - 12+ Conceptual Questions       │        │ - Student Name & Reg No  │
│ - Tiered Hints & Explanations    │        │ - High-Res Figures       │
│ - Performance Score & Badge      │        │ - Complete Interpretations│
│ - Review Weak Areas              │        │ - PDF Vector Export      │
└──────────────────────────────────┘        └──────────────────────────┘
```

### Module Breakdown
1. `src/components/Header.tsx`: Institutional header with SRM logo, department details, and clean navigation.
2. `src/components/MoleculeInputBar.tsx`: SMILES entry, curated example presets, validation state, and toggle for 2D sketcher.
3. `src/components/ChemicalSketcherModal.tsx`: Visual structure builder to assemble rings, chains, and functional groups.
4. `src/components/MolecularViewer3D.tsx`: Interactive 3Dmol.js canvas with style picker, surface generation, spin toggle, and screenshot export.
5. `src/components/PropertiesAndLipinski.tsx`: Comprehensive descriptor metrics grid, σ/π bond calculations, and Lipinski/Veber rule compliance matrix with radar chart.
6. `src/components/BatchComparator.tsx`: Multi-compound tabular comparison and property correlation.
7. `src/components/AssessmentQuiz.tsx`: Interactive test with instant explanations, hint reveals, and score summary.
8. `src/components/LabReportGenerator.tsx`: Student metadata input, multi-molecule compilation, and one-click PDF generation.
9. `src/services/cheminformatics.ts`: Core chemical calculation algorithms (molecular formula parsing, molecular weight, LogP approximations, TPSA, bond order partitioning, Lipinski checks).
10. `src/services/pubchem.ts`: Integration with PubChem PUG REST API for 3D coordinates, conformers, and authoritative reference data.
