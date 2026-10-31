export function criterionShortLabel(name: string) {
  const known: Record<string, string> = {
    'Originalidade e inovação': 'Originalidade',
    'Rigor metodológico e qualidade técnica': 'Rigor',
    'Clareza e organização da apresentação': 'Clareza',
    'Relevância e impacto': 'Relevância',
  }

  if (known[name]) {
    return known[name]
  }

  return name.split(' ')[0] ?? name
}
