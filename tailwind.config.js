let purge_list = [
  '../public/index.html',
  // '**/ui/src/**/*.{vue,js,ts,jsx,tsx,html}',
  './src/**/*.{vue,js,ts,jsx,tsx,html}',
]
if (process.env.BUILD_FOR === 'lib') {
  purge_list = ['./dist/static/blocks/*.js']
}
// console.log('tailwind purge list', purge_list)

module.exports = {
  mode: 'jit',
  content: purge_list,
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    // colors: {
    //   blue: colors.blue,
    // },
    extend: {},
    container: {
      center: true,
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    // require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
}
