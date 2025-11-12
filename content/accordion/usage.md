The accordion can be used to pack a lot of content into a constraint space by allowing to collapse and expand the accordion item to show or hide its contents. It also allows the user to consume the contents at their own pace and preference by not immediately showing but relying on progressive disclosure instead.

![image.png](images/image.png)

Therefore when used right, accordions can help browse different pieces of related content in a more efficient way. Be wary that they can also hide content from users and are not suitable when a user is meant to read all of the page content.

### Heading

The heading of the accordion should give the user a clear indication of what the contents of accordion item are going to be. The user should not have to open the accordion item to understand what is contained inside of it.

### Panel

The panel is what contains the content of an accordion item. Be mindful of what contents are put in the accordion item as an accordion does not lend itself well to containing overly complex components or patterns. The contents of an accordion will most often be just plain text or a simple component arrangement like filters (checkbox + label).

It is not allowed to nest component items.

### When to use

*   In cases where there is a lot more content than the available screen estate allows for. E.g. when there is a lot of filters to show in a sidebar.
*   When you want to allow the user to scan large amounts of contents in a smaller amount of space and dive deeper at their own choosing. E.g. in an FAQ.
*   To shorten page lengths (an scroll time) if it is not important that the user reads everything.

### When not to use

*   It’s not recommended to use accordions when the page content must be seen at a glance by a user.
*   *   Instead you might consider restructuring your content or using anchor links in the beginning of the page which redirect the user to specific sections of the page.
*   If the data you want to show is inherently nested as navigation items do not allow to be nested.