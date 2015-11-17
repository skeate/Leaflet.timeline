var gulp = require('gulp');
var coffee = require('gulp-coffee');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require('gulp-rename');
var webserver = require('gulp-webserver');

gulp.task('sass', function() {
  return gulp.src('src/*.sass')
    .pipe(sourcemaps.init())
      .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
});

gulp.task('js', function() {
  return gulp.src('src/*.coffee')
    .pipe(sourcemaps.init())
      .pipe(coffee())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
});

gulp.task('sass-min', function() {
  return gulp.src('src/*.sass')
    .pipe(sass())
    .pipe(uglifycss())
    .pipe(rename('leaflet.timeline.min.css'))
    .pipe(gulp.dest('dist'))
});

gulp.task('js-min', function() {
  return gulp.src('src/*.coffee')
    .pipe(coffee())
    .pipe(uglify())
    .pipe(rename('leaflet.timeline.min.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('webserver', function() {
  return gulp.src('.')
    .pipe(webserver({
      livereload: true
    }))
});

gulp.task('watch', function() {
  gulp.watch('src/*.coffee', ['js'])
  gulp.watch('src/*.sass', ['sass'])
})

gulp.task('default', ['sass', 'js']);

gulp.task('min-build', ['sass-min', 'js-min']);

gulp.task('start', ['default', 'webserver', 'watch']);
