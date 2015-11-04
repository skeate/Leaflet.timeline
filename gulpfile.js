var gulp = require('gulp');
var coffee = require('gulp-coffee');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require('gulp-rename');

gulp.task('sass', function() {
  return gulp.src('src/*.sass')
    .pipe(sourcemaps.init())
      .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
    .pipe(uglifycss())
    .pipe(rename('leaflet.timeline.min.css'))
    .pipe(gulp.dest('dist'))
});

gulp.task('js', function() {
  return gulp.src('src/*.coffee')
    .pipe(sourcemaps.init())
      .pipe(coffee())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('leaflet.timeline.min.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('default', ['sass', 'js']);
