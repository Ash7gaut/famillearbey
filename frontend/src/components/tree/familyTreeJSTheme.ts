import FamilyTree from '@balkangraph/familytree.js';

const ARBEY_COLORS: [string, string][] = [
  ['#039BE5', '#5c6d50'],
  ['#039be5', '#5c6d50'],
  ['#F57C00', '#d47b3f'],
  ['#f57c00', '#d47b3f'],
  ['#aeaeae', '#495643'],
];

function remapTemplateColors<T>(template: T): T {
  let json = JSON.stringify(template);
  for (const [from, to] of ARBEY_COLORS) {
    json = json.split(from).join(to);
  }
  return JSON.parse(json) as T;
}

function withLabelStyle(fieldHtml: string): string {
  return fieldHtml
    .replace('font-size: 16px', 'font-size: 15px')
    .replace('font-size: 13px', 'font-size: 12px')
    .replace('font-weight:bold', 'font-weight:600');
}

let registered = false;

/** Templates john recolorés aux couleurs Famille Arbey (vert sauge / terracotta). */
export function registerArbeyFamilyTreeTemplates() {
  if (registered) return;
  registered = true;

  const base = remapTemplateColors(FamilyTree.templates.john);
  const male = remapTemplateColors(FamilyTree.templates.john_male);
  const female = remapTemplateColors(FamilyTree.templates.john_female);

  if (male.field_0) male.field_0 = withLabelStyle(male.field_0);
  if (male.field_1) male.field_1 = withLabelStyle(male.field_1);
  if (female.field_0) female.field_0 = withLabelStyle(female.field_0);
  if (female.field_1) female.field_1 = withLabelStyle(female.field_1);

  FamilyTree.templates.arbey = base;
  FamilyTree.templates.arbey_male = male;
  FamilyTree.templates.arbey_female = female;
}
