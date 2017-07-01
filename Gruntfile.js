module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        minifyHtml: {
            options: {
                cdata: true
            },
            dist: {
                files: {
                    'dist/index.html': 'src/index.html'
                }
            }
        },
        uglify : {
            options : {
                mangle : false
            },

            my_target : {
                files : {
                'dist/bundle.min.js' : [ 'src/assets/js/app.js' ]
                }
            }
        },
        sass: {
            dist: {
                options: {
                    style: "compressed"
                },
                files: {
                    'dist/style.css' : 'src/assets/sass/app.scss'
                }
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, src: ['src/assets/fonts/*'], dest: 'dist/'}
                ]
            }
        },
        watch : {
            dist : {
                files : [
                'src/assets/js/**/*',
                'src/assets/sass/**/*',
                'src/*.html'
                ],

                tasks : [ 'minifyHtml','uglify','sass' ]
            }
        } // watch
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-minify-html' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    grunt.registerTask('default', ['minifyHtml','uglify','sass']);
    
    grunt.registerTask( 'w', [ 'watch' ] );
}