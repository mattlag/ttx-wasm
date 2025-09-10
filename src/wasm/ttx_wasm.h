#ifndef TTX_WASM_H
#define TTX_WASM_H

#include <vector>
#include <string>
#include <map>
#include <memory>
#include <cstdint>

/**
 * TTX-WASM: C++ implementation for WebAssembly compilation
 * 
 * This header defines the core structures and classes that will be
 * compiled to WebAssembly for font processing functionality.
 */

namespace ttx_wasm {

// Forward declarations
class FontReader;
class TTXWriter;
class FontTable;

// Type aliases for clarity
using ByteArray = std::vector<uint8_t>;
using TableMap = std::map<std::string, std::shared_ptr<FontTable>>;

/**
 * Font format enumeration
 */
enum class FontFormat {
    UNKNOWN,
    TTF,
    OTF,
    WOFF,
    WOFF2,
    TTC,
    TTX
};

/**
 * TTX processing options
 */
struct TTXOptions {
    std::vector<std::string> onlyTables;
    std::vector<std::string> skipTables;
    bool splitTables = false;
    bool splitGlyphs = false;
    bool disassembleInstructions = true;
    int fontNumber = -1;
    bool ignoreDecompileErrors = true;
    bool recalcBBoxes = true;
    std::string flavor;
    
    TTXOptions() = default;
};

/**
 * Font metadata structure
 */
struct FontMetadata {
    std::string family;
    std::string style;
    std::string version;
    uint16_t unitsPerEm = 0;
    uint64_t created = 0;
    uint64_t modified = 0;
    
    FontMetadata() = default;
};

/**
 * Font information structure
 */
struct FontInfo {
    FontFormat format = FontFormat::UNKNOWN;
    std::vector<std::string> tables;
    FontMetadata metadata;
    int fontCount = 1;  // For TTC files
    
    FontInfo() = default;
};

/**
 * Processing result structure
 */
struct TTXResult {
    ByteArray data;
    std::string format;
    std::vector<std::string> warnings;
    bool success = false;
    
    TTXResult() = default;
};

/**
 * Base class for font tables
 */
class FontTable {
public:
    FontTable(const std::string& tag) : tag_(tag) {}
    virtual ~FontTable() = default;
    
    const std::string& getTag() const { return tag_; }
    virtual bool parse(const ByteArray& data) = 0;
    virtual ByteArray serialize() const = 0;
    virtual std::string toXML() const = 0;
    virtual bool fromXML(const std::string& xml) = 0;
    
protected:
    std::string tag_;
};

/**
 * Generic table implementation for unknown table types
 */
class GenericTable : public FontTable {
public:
    GenericTable(const std::string& tag) : FontTable(tag) {}
    
    bool parse(const ByteArray& data) override;
    ByteArray serialize() const override;
    std::string toXML() const override;
    bool fromXML(const std::string& xml) override;
    
private:
    ByteArray rawData_;
};

/**
 * Font reader class for parsing binary font files
 */
class FontReader {
public:
    FontReader() = default;
    ~FontReader() = default;
    
    bool loadFont(const ByteArray& data);
    FontFormat detectFormat(const ByteArray& data) const;
    FontInfo getFontInfo() const;
    std::vector<std::string> getTableList() const;
    std::shared_ptr<FontTable> getTable(const std::string& tag) const;
    
private:
    FontFormat format_ = FontFormat::UNKNOWN;
    TableMap tables_;
    FontMetadata metadata_;
    int fontCount_ = 1;
    
    bool parseTTF(const ByteArray& data);
    bool parseOTF(const ByteArray& data);
    bool parseWOFF(const ByteArray& data);
    bool parseWOFF2(const ByteArray& data);
    bool parseTTC(const ByteArray& data);
    
    bool parseTableDirectory(const ByteArray& data, size_t offset);
    std::shared_ptr<FontTable> createTable(const std::string& tag, const ByteArray& data);
};

/**
 * TTX XML writer class
 */
class TTXWriter {
public:
    TTXWriter() = default;
    ~TTXWriter() = default;
    
    std::string convertToXML(const FontReader& reader, const TTXOptions& options) const;
    
private:
    std::string generateHeader() const;
    std::string generateGlyphOrder(const FontReader& reader) const;
    std::string generateTableXML(const FontTable& table) const;
    std::string generateFooter() const;
    
    bool shouldIncludeTable(const std::string& tag, const TTXOptions& options) const;
};

/**
 * TTX XML parser class
 */
class TTXParser {
public:
    TTXParser() = default;
    ~TTXParser() = default;
    
    bool parseXML(const std::string& xml);
    ByteArray generateFont(const TTXOptions& options) const;
    
private:
    TableMap tables_;
    FontMetadata metadata_;
    
    bool parseTableFromXML(const std::string& tableXML);
    ByteArray generateTTF() const;
    ByteArray generateOTF() const;
};

/**
 * Main TTX processing class
 */
class TTXProcessor {
public:
    TTXProcessor() = default;
    ~TTXProcessor() = default;
    
    // Font format detection
    FontFormat detectFormat(const ByteArray& data) const;
    
    // Font information extraction
    FontInfo getFontInfo(const ByteArray& data, const TTXOptions& options = TTXOptions()) const;
    
    // Font to TTX conversion
    TTXResult dumpToTTX(const ByteArray& fontData, const TTXOptions& options = TTXOptions()) const;
    
    // TTX to font conversion
    TTXResult compileFromTTX(const std::string& ttxData, const TTXOptions& options = TTXOptions()) const;
    
    // Table listing
    std::vector<std::string> listTables(const ByteArray& fontData, const TTXOptions& options = TTXOptions()) const;
    
private:
    mutable FontReader reader_;
    mutable TTXWriter writer_;
    mutable TTXParser parser_;
};

} // namespace ttx_wasm

// C-style API for easier WASM binding
extern "C" {
    
// Memory management
void* ttx_alloc(size_t size);
void ttx_free(void* ptr);

// Font format detection
int ttx_detect_format(const uint8_t* data, size_t size);

// Font information
int ttx_get_font_info(const uint8_t* data, size_t size, char* info_json, size_t info_size);

// Font to TTX conversion
int ttx_dump_to_ttx(const uint8_t* font_data, size_t font_size, 
                    const char* options_json, 
                    char** ttx_output, size_t* ttx_size);

// TTX to font conversion
int ttx_compile_from_ttx(const char* ttx_data, size_t ttx_size,
                         const char* options_json,
                         uint8_t** font_output, size_t* font_size);

// Table listing
int ttx_list_tables(const uint8_t* data, size_t size, 
                    char** tables_json, size_t* json_size);

// Cleanup
void ttx_cleanup_output(void* ptr);

} // extern "C"

#endif // TTX_WASM_H
