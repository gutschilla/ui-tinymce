/**
 * Binds a TinyMCE widget to <textarea> elements.
 *
 * merged with: https://github.com/angular-ui/ui-tinymce/pull/50 (setup option does not overwrite entire setup)
 * merged with: https://github.com/angular-ui/ui-tinymce/pull/53 (destroy instance when element is destroyed)
 * merged with: https://github.com/tarjei/ui-tinymce/commit/89e80b509de486368078027dbb0e7ee6e9b32c3a (Forward blur event to outer element)
 * 
 */
angular.module('ui.tinymce', [])
  .value('uiTinymceConfig', {})
  .directive('uiTinymce', ['uiTinymceConfig', function (uiTinymceConfig) {
    uiTinymceConfig = uiTinymceConfig || {};
    var generatedIds = 0;
    return {
      require: 'ngModel',
      priority: 10, // as of angular 1.2.0 rc3 and above, this is required to insure this link function is applied AFTER, and not overwritten by, that of textarea and ngModel directives
      link: function (scope, elm, attrs, ngModel) {
        var expression, options, tinyInstance,
          updateView = function () {
            ngModel.$setViewValue(elm.val());
            if (!scope.$$phase) {
              scope.$apply();
            }
          };
        // generate an ID if not present
        if (!attrs.id) {
          attrs.$set('id', 'uiTinymce' + generatedIds++);
        }

        if (attrs.uiTinymce) {
          expression = scope.$eval(attrs.uiTinymce);
        } else {
          expression = {};
        }

        // make config'ed setup method available
        if (expression.setup) {
            var configSetup = expression.setup;
            delete expression.setup;
        }

        options = {
          // Update model when calling setContent (such as from the source editor popup)
          setup: function (ed) {
            var args;
            ed.on('init', function(args) {
              ngModel.$render();
            });
            // Update model on button click
            ed.on('ExecCommand', function (e) {
              ed.save();
              updateView();
            });
            // Update model on keypress
            ed.on('KeyUp', function (e) {
              ed.save();
              updateView();
            });
            // Update model on change, i.e. copy/pasted text, plugins altering content
            ed.on('SetContent', function (e) {
              if(!e.initial){
                ed.save();
                updateView();
              }
            });
            // Forward blur event to outer element
            ed.on('blur', function(e) {
              elm.blur();
              if (!scope.$$phase) { /* unsure if this is needed. */
                scope.$apply();
              }
            });            if (configSetup) {
              configSetup( ed );
            }
          },
          mode: 'exact',
          elements: attrs.id
        };
        // extend options with initial uiTinymceConfig and options from directive attribute value
        angular.extend(options, uiTinymceConfig, expression);
        setTimeout(function () {
          tinymce.init(options);
        });


        ngModel.$render = function() {
          if (!tinyInstance) {
            tinyInstance = tinymce.get(attrs.id);
          }
          if (tinyInstance) {
            tinyInstance.setContent(ngModel.$viewValue || '');
          }
        };


        scope.$on('$destroy', function() {
            if (!tinyInstance) { tinyInstance = tinymce.get(attrs.id); }
            if (tinyInstance) {
              tinyInstance.remove();
              tinyInstance = null;
            }
        });

      }
    };
  }]);
