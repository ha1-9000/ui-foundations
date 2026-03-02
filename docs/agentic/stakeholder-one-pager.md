# UI Foundations V5: Agentic Token-First One-Pager

## 1) Executive Summary
UI Foundations V5 establishes an agent-assisted, token-first design-to-code operating model.  
The objective is to convert design intent into production-ready outputs faster, with higher consistency and lower delivery risk.

The system is intentionally engineered for high automation (developers + agents as primary operators), while design remains the owner of visual and system decisions.

## 2) Why This Matters
- Current Figma-to-code alignment is incomplete (token naming and structure differences across versions).
- Manual translation creates avoidable rework, inconsistencies, and slower release cycles.
- V5 provides the foundation to scale UI delivery without introducing breaking changes to ongoing release work.

## 3) How It Works (End-to-End)
1. Design and token intent are defined in Figma.
2. Tokens are exported and transformed into implementation artifacts.
3. Agentic workflows generate or update components and docs in repository context.
4. Outputs are validated through CI quality gates.
5. Teams review implementation via docs/playground artifacts.

Quality gates:
- `npm run lint`
- `npm run test:unit`
- `npm run ci:check`

## 4) Platform-Agnostic by Design
The architecture is platform-agnostic: one token source of truth feeds all channels.  
This includes mobile integration, where iOS and Android token artifacts are generated from the same standardized pipeline, reducing platform drift and duplicate mapping work.

## 5) Accessibility by Default
Accessibility is built into the implementation flow:
- semantic component structure and state modeling
- a11y-aware component generation patterns
- validation integrated into normal delivery checks, not added at the end

## 6) AI Skillset and Codex Enablement
The project already uses a practical AI skillset to generate proposals and implementation drafts in repository context, preferably with Codex.  
Current capabilities include:
- token naming and structure proposals
- component/state scaffolding
- docs/playground integration
- implementation aligned with existing architecture and rules

This enables faster iteration while maintaining technical and governance constraints.

## 7) Ownership Model
- **Design Lead:** owns token intent, naming direction, and visual quality.
- **Product Manager:** owns prioritization, scope, and release outcomes.
- **Engineering + Agents:** own operational implementation and automation execution.

Key principle: the setup is technically strong because developers/agents are the main operators, but ownership of the design system remains with design.

## 8) Current Status and Potential
Current POCs show that agent-assisted delivery can already produce usable implementation proposals and integrated code outputs.  
Once token harmonization is completed in V5, the model can scale to:
- faster component delivery
- higher cross-team consistency
- easier rebrand and multi-platform rollout
- lower long-term maintenance cost

## 9) Future-Proofing and Standards
The token export pipeline is aligned with the current Design Tokens specification draft to ensure long-term interoperability and production usability.

Reference:
- [Design Tokens Format Schema (2025.10 Draft)](https://www.designtokens.org/schemas/2025.10/format.json)

## 10) Resources
- GitHub: [ui-foundations](https://github.com/tbielich/ui-foundations)
- Figma: [UI Foundations](https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?m=auto&node-id=0-1&t=TMxvgs1Gc1bzLG3U-1)
