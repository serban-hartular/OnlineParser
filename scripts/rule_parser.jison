/* lexical grammar */
%lex

%%

[ \t]+                   /* skip whitespace */
[\n\r]+                 return 'EOL'
[0-9]+("."[0-9]+)?\b        return 'NUMBER';
"."[0-9]+\b                 return 'NUMBER';
[a-zA-Z][_a-zA-Z0-9]*\b  return 'STRING'
"->"                    return '->'
"+="                    return '+='
"=="                    return '==';
"="                     return '=';
"~"                     return '~';
"!"                     return '!';
"?"                     return '?';
"@"                     return '@'
<<EOF>>                 return 'EOF';
"["                     return '['
"]"                     return ']'
","                     return ','
":"                     return ':'
.                       return yytext[0]

/lex

/* operator associations and precedence */

/******************
 * %left '+' '-'
 * %left '*' '/'
 * %left '^'
 * %left UMINUS
 *******************/

%start expressions


%% /* language grammar */


expressions : rule_list EOF { return { 'rule_list':$1, 'error_list':error_list}; }
            ;

rule_list
    :   rule_list rule      { $$ = $1; if($2 != null) { $1.push($2) } }
    |                       { $$ = [] }
    ;

rule
    :   phrase '->' child_list EOL   { $$ = $3; $$.unshift($1, $2) }
    |   phrase '+=' child_list EOL   { $$ = $3; $$.unshift($1, $2) }
    |   error  EOL      { console.log('Error on line ' + @1.first_line + ' col ' + @1.first_column + ' to ' + @1.last_column);
                        error_list.push('Error on line ' + @1.first_line + ' col ' + @1.first_column + ' to ' + @1.last_column);
                        }
    |   EOL         {$$ = null}
    ;

child_list
    :   child_list child        { $$ = $1; $$.push($2) }
    |   child_list ',' child    { $$ = $1; $$.push($3) /*    |   child { $$ = [$1]; } */ }
    |                           { $$ = [] }
    ;

child
    : STRING ':' phrase { $$ = $1 + $2 + $3; }
    | STRING '*' ':' phrase { $$ = $1 + $2 + $3 + $4; }
    ;


phrase
    :   STRING { $$ = $1 }
    |   STRING '[' constraint_list ']'  {$$ = $1 + $2 + $3.join(' ') + $4; }
    ;
    

constraint_list
    : constraint_list constraint { $$ = $1; $$.push($2) }
    | constraint { $$ = [$1]; }
    ;

constraint  : lval operator rval            { $$ = $1 + $2 + $3; }
            | lval operator rval mark       { $$ = $1 + $2 + $3 + $4; }
            ;
    
lval    : STRING 
        ;
        
rval    : STRING 
        | '@'
        | NUMBER
        ;
        
operator    :   '='
            |   '=='
            |   '~'
            ;
            
mark        :   '!'
            |   '?' NUMBER {$$ = $1 + $2 }
            ;

%%

var error_list = []
    
