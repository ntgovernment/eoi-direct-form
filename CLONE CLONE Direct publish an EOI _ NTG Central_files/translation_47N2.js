/**
* +--------------------------------------------------------------------+
* | This MySource Matrix CMS file is Copyright (c) Squiz Pty Ltd       |
* | ABN 77 084 670 600                                                 |
* +--------------------------------------------------------------------+
* | IMPORTANT: Your use of this Software is subject to the terms of    |
* | the Licence provided in the file licence.txt. If you cannot find   |
* | this file please contact Squiz (www.squiz.com.au) so we may provide|
* | you a copy.                                                        |
* +--------------------------------------------------------------------+
*/


/**
* Translates a localisable string found in JavaScript code
*
* @deprecated No replacement
* @see https://jira.squiz.net/browse/MATRIX-4402
* @param string	string_code	the string code to translate
* @return string
*/
function js_translate()
{
    var replacements = [];

    for (i = 1; i < arguments.length; i++) {
        replacements.push(arguments[i]);
    }

    return vsprintf(arguments[0], replacements);
}
