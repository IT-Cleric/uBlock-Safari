'use strict';

var browser = 'safari';

var del = require('del');
var gulp = require('gulp');
var path = require('path');
var merge = require('merge-stream');
var config = require('./gulpfile.config')(browser);
var tasks = config.tasks;
var $ = require('gulp-load-plugins')();

gulp.task('watch', function() {
    for (var task in tasks) {
        if (!tasks.hasOwnProperty(task)) continue;
        gulp.watch(task.map(function(location) {
            return location.src;
        }), task);
    }
});

gulp.task('assets', function() {
    return merge(tasks.assets.map(function(asset) {
        return gulp.src(asset.src)
            .pipe($.rename(function(path) {
                if (path.extname === '' && config.extension.indexOf(path.basename) !== -1) {
                    path.extname = '.txt';
                }
            }))
            .pipe(gulp.dest(asset.dest));
    }));
});

gulp.task('css', function() {
    return merge(tasks.css.map(function(css) {
        return gulp.src(css.src)
            .pipe($.replace('__MSG_@@bidi_start_edge__', 'left'))
            .pipe($.autoprefixer({
                browsers: ['last 10 ' + browser + ' versions'],
                cascade: false,
                add: false
            }))
            .pipe($.cleanCss())
            .pipe(gulp.dest(css.dest));
    }));
});

gulp.task('html', function() {
    return merge(tasks.html.map(function(html) {
        return gulp.src(html.src)
            .pipe($.htmlmin({
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                removeRedundantAttributes: true,
                sortAttributes: true,
                sortClassName: true
            }))
            .pipe(gulp.dest(html.dest));
    }));
});

gulp.task('js', function() {
    return merge(tasks.js.map(function(js) {
        return gulp.src(js.src)
            .pipe($.uglify())
            .pipe(gulp.dest(js.dest));
    }));
});

gulp.task('lib', function() {
    return merge(tasks.lib.map(function(lib) {
        return gulp.src(lib.src)
            .pipe($.uglify())
            .pipe(gulp.dest(lib.dest));
    }));
});

gulp.task('static-files', function() {
    return merge(tasks.static.map(function(file) {
        var ret = merge(gulp.src(file.src));
        if (file.rename) {
            // rename files from key to value
            ret.add(Object.keys(file.rename).map(function(key) {
                return gulp.src(key)
                    .pipe($.rename(file.rename[key]));
            }));
        }
        return ret.pipe(gulp.dest(file.dest));
    }));
});

gulp.task('static', ['static-files'], $.shell.task('python tools/make-' + browser + '-meta.py ' + config.DEST));

gulp.task('clean', function() {
    return del(config.DEST);
});

gulp.task('build', Object.keys(tasks));

// gulp.task('default', gulp.series('clean', 'build', 'watch'))
gulp.task('default', ['clean'], function() {
    gulp.start('build');
    gulp.start('watch');
});
