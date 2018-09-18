'use strict';

const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const del = require('del');
const runSequence = require('run-sequence');

const $ = gulpLoadPlugins();

gulp.task('extras', () =>
  gulp
    .src(['app/*.*', 'app/_locales/**', '!app/scripts', '!app/*.json'], {
      base: 'app',
      dot: true,
    })
    .pipe(gulp.dest('dist'))
);

function lint(files, options) {
  return () =>
    gulp
      .src(files)
      .pipe($.eslint(options))
      .pipe($.eslint.format());
}

gulp.task(
  'lint',
  lint('app/scripts/**/*.js', {
    env: {
      es6: true,
    },
  })
);

gulp.task('images', () =>
  gulp
    .src('app/images/**/*')
    .pipe(
      $.if(
        $.if.isFile,
        $.cache(
          $.imagemin({
            progressive: true,
            interlaced: true,
            // don't remove IDs from SVGs, they are often used
            // as hooks for embedding and styling
            svgoPlugins: [{cleanupIDs: false}],
          })
        ).on('error', function(err) {
          console.log(err);
          // eslint-disable-next-line no-invalid-this
          this.end();
        })
      )
    )
    .pipe(gulp.dest('dist/images'))
);

gulp.task('chromeManifest', () =>
  gulp
    .src('app/manifest.json')
    .pipe(
      $.chromeManifest({
        buildnumber: require('./package.json').version,
        background: {
          target: 'scripts/background.js',
          exclude: ['scripts/chromereload.js'],
        },
      })
    )
    .pipe(gulp.dest('dist'))
);

gulp.task('clean', () => del(['.tmp', 'dist']));

gulp.task('watch', ['lint'], () => {
  $.livereload.listen();

  gulp
    .watch(['app/scripts/**/*.js', 'app/images/**/*', 'app/styles/**/*', 'app/_locales/**/*.json'])
    .on('change', $.livereload.reload);

  gulp.watch('app/scripts/**/*.js', ['lint']);
});

gulp.task('size', () => gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true})));

gulp.task('package', ['default'], () => {
  const manifest = require('./dist/manifest.json');
  return gulp
    .src('dist/**/*')
    .pipe($.zip(`utm_killer-${manifest.version}.zip`))
    .pipe(gulp.dest('package'));
});

gulp.task('build', cb => {
  runSequence(
    'lint',
    'chromeManifest',
    // ['html', 'css', 'extras'],
    ['extras'],
    'size',
    cb
  );
});

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});
