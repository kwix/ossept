// Footer Navigation
// ------------
// Description: The footer navigation data for the website.
export interface Logo {
	src: string
	alt: string
	text: string
}

export interface FooterAbout {
	title: string
	aboutText: string
	logo: Logo
}

export interface SubCategory {
	subCategory: string
	subCategoryLink: string
}

export interface FooterColumn {
	category: string
	subCategories: SubCategory[]
}

export interface SubFooter {
	copywriteText: string
}

export interface FooterData {
	footerAbout: FooterAbout
	footerColumns: FooterColumn[]
	subFooter: SubFooter
}

export const footerNavigationData: FooterData = {
	footerAbout: {
		title: 'Ossept',
		aboutText:
			'Organización Sindical de Servidores Públicos Territoriales',
		logo: {
			src: '/logo.png',
			alt: 'Ossept',
			text: 'Ossept'
		}
	},
	footerColumns: [
		{
			category: 'Nuestra Organización',
			subCategories: [
				{
					subCategory: 'Misión',
					subCategoryLink: '/blog'
				},
				{
					subCategory: 'Visión',
					subCategoryLink: '/changelog'
				},
				{
					subCategory: 'Estatutos',
					subCategoryLink: '/faq'
				},
				
				{
					subCategory: 'Acuerdos',
					subCategoryLink: '/terms'
				}
			]
		},
		{
			category: 'Relevantes',
			subCategories: [
				{
					subCategory: 'Directivos',
					subCategoryLink: '/features'
				},
				{
					subCategory: 'Noticias',
					subCategoryLink: '/pricing'
				}
			]
		},
		{
			category: 'Contacto',
			subCategories: [
				{
					subCategory: 'Contáctenos',
					subCategoryLink: '/contact'
				}
			]
		}
	],
	subFooter: {
		copywriteText: '© OSSEPT 2025.'
	}
}
