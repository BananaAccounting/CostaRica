cmake_minimum_required(VERSION 3.16)

project(ch.banana.costarica.import.statement.scotiabank)
set(EXTENSION_ID "ch.banana.costarica.import.statement.scotiabank")

find_package(Qt6 COMPONENTS Core REQUIRED)
find_package(Qt6 COMPONENTS LinguistTools REQUIRED)

# The target ch.banana.costarica.import.statement.scotiabank is used to build the extension to a sbaa package
# and set the source files for the IDE
add_custom_target(ch.banana.costarica.import.statement.scotiabank ALL
    COMMAND ${QT_CMAKE_EXPORT_NAMESPACE}::rcc -o ${EXTENSION_ID}.sbaa --binary ${EXTENSION_ID}.qrc
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    SOURCES ${EXTENSION_ID}.qrc
)