var gulp = require('gulp');
var concat = require('gulp-concat');

var paths = {
    src: [
        'src/constants.js',
        'src/display.js',
        'src/astro.js',
        'src/mtrng.js',
        'src/structs.js',
        'src/utils.js',
        'src/accrete.js',
        'src/main.js'
    ]
};

gulp.task('scripts', function() {
    return gulp.src(paths.src)
        .pipe(concat('accrete.js'))
        .pipe(gulp.dest('./lib'));
});

// Default task
gulp.task('default', function() {
    gulp.start('scripts');
});
