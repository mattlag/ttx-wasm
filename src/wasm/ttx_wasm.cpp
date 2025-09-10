#include "ttx_wasm.h"
#include <cstring>
#include <algorithm>
#include <sstream>
#include <iomanip>

namespace ttx_wasm {

// Utility functions
namespace {
    
uint32_t readUint32BE(const uint8_t* data) {
    return (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
}

uint16_t readUint16BE(const uint8_t* data) {
    return (data[0] << 8) | data[1];
}

std::string bytesToHex(const ByteArray& data) {
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (size_t i = 0; i < data.size(); ++i) {
        ss << std::setw(2) << static_cast<int>(data[i]);
        if (i < data.size() - 1) ss << " ";
    }
    return ss.str();
}

} // anonymous namespace

// GenericTable implementation
bool GenericTable::parse(const ByteArray& data) {
    rawData_ = data;
    return true;
}

ByteArray GenericTable::serialize() const {
    return rawData_;
}

std::string GenericTable::toXML() const {
    std::stringstream ss;
    ss << "  <" << tag_ << ">\n";
    ss << "    <!-- Table '" << tag_ << "' - unsupported table type -->\n";
    ss << "    <hexdata>\n      " << bytesToHex(rawData_) << "\n    </hexdata>\n";
    ss << "  </" << tag_ << ">\n";
    return ss.str();
}

bool GenericTable::fromXML(const std::string& xml) {
    // This is a simplified implementation
    // In a real implementation, we'd parse the XML properly
    rawData_.clear();
    return true;
}

// FontReader implementation
bool FontReader::loadFont(const ByteArray& data) {
    if (data.empty()) {
        return false;
    }
    
    format_ = detectFormat(data);
    
    switch (format_) {
        case FontFormat::TTF:
        case FontFormat::OTF:
            return parseTTF(data);
        case FontFormat::WOFF:
            return parseWOFF(data);
        case FontFormat::WOFF2:
            return parseWOFF2(data);
        case FontFormat::TTC:
            return parseTTC(data);
        default:
            return false;
    }
}

FontFormat FontReader::detectFormat(const ByteArray& data) const {
    if (data.size() < 4) {
        return FontFormat::UNKNOWN;
    }
    
    uint32_t signature = readUint32BE(data.data());
    
    // Check for TTF/OTF
    if (signature == 0x00010000 || signature == 0x10000) {
        return FontFormat::TTF;
    }
    if (signature == 0x4F54544F) { // 'OTTO'
        return FontFormat::OTF;
    }
    if (signature == 0x74746366) { // 'ttcf'
        return FontFormat::TTC;
    }
    if (signature == 0x774F4646) { // 'wOFF'
        return FontFormat::WOFF;
    }
    if (signature == 0x774F4632) { // 'wOF2'
        return FontFormat::WOFF2;
    }
    
    return FontFormat::UNKNOWN;
}

FontInfo FontReader::getFontInfo() const {
    FontInfo info;
    info.format = format_;
    info.fontCount = fontCount_;
    info.metadata = metadata_;
    
    for (const auto& pair : tables_) {
        info.tables.push_back(pair.first);
    }
    
    return info;
}

std::vector<std::string> FontReader::getTableList() const {
    std::vector<std::string> tables;
    for (const auto& pair : tables_) {
        tables.push_back(pair.first);
    }
    return tables;
}

std::shared_ptr<FontTable> FontReader::getTable(const std::string& tag) const {
    auto it = tables_.find(tag);
    return (it != tables_.end()) ? it->second : nullptr;
}

bool FontReader::parseTTF(const ByteArray& data) {
    if (data.size() < 12) {
        return false;
    }
    
    // Read offset table
    size_t offset = 4; // Skip sfnt version
    uint16_t numTables = readUint16BE(data.data() + offset);
    offset += 2;
    
    // Skip searchRange, entrySelector, rangeShift
    offset += 6;
    
    return parseTableDirectory(data, offset);
}

bool FontReader::parseOTF(const ByteArray& data) {
    // OTF has the same structure as TTF for table directory
    return parseTTF(data);
}

bool FontReader::parseWOFF(const ByteArray& data) {
    // WOFF parsing would be more complex
    // For now, return false to indicate unsupported
    return false;
}

bool FontReader::parseWOFF2(const ByteArray& data) {
    // WOFF2 parsing would be more complex
    // For now, return false to indicate unsupported
    return false;
}

bool FontReader::parseTTC(const ByteArray& data) {
    // TTC parsing would be more complex
    // For now, return false to indicate unsupported
    return false;
}

bool FontReader::parseTableDirectory(const ByteArray& data, size_t offset) {
    if (offset < 12) return false;
    
    uint16_t numTables = readUint16BE(data.data() + 4);
    
    // Read table directory entries
    for (uint16_t i = 0; i < numTables; ++i) {
        size_t entryOffset = offset + i * 16;
        if (entryOffset + 16 > data.size()) {
            return false;
        }
        
        // Read table tag (4 bytes)
        std::string tag(reinterpret_cast<const char*>(data.data() + entryOffset), 4);
        
        // Read table metadata
        uint32_t checksum = readUint32BE(data.data() + entryOffset + 4);
        uint32_t tableOffset = readUint32BE(data.data() + entryOffset + 8);
        uint32_t length = readUint32BE(data.data() + entryOffset + 12);
        
        // Extract table data
        if (tableOffset + length > data.size()) {
            continue; // Skip invalid table
        }
        
        ByteArray tableData(data.begin() + tableOffset, data.begin() + tableOffset + length);
        tables_[tag] = createTable(tag, tableData);
    }
    
    return true;
}

std::shared_ptr<FontTable> FontReader::createTable(const std::string& tag, const ByteArray& data) {
    // For now, create generic tables for all types
    // In a full implementation, we'd have specific table classes
    auto table = std::make_shared<GenericTable>(tag);
    table->parse(data);
    return table;
}

// TTXWriter implementation
std::string TTXWriter::convertToXML(const FontReader& reader, const TTXOptions& options) const {
    std::stringstream ss;
    
    ss << generateHeader();
    ss << generateGlyphOrder(reader);
    
    auto tables = reader.getTableList();
    for (const auto& tag : tables) {
        if (shouldIncludeTable(tag, options)) {
            auto table = reader.getTable(tag);
            if (table) {
                ss << generateTableXML(*table);
            }
        }
    }
    
    ss << generateFooter();
    
    return ss.str();
}

std::string TTXWriter::generateHeader() const {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
           "<ttFont sfntVersion=\"\\x00\\x01\\x00\\x00\" ttLibVersion=\"4.0\">\n\n";
}

std::string TTXWriter::generateGlyphOrder(const FontReader& reader) const {
    // Simplified glyph order generation
    return "  <GlyphOrder>\n"
           "    <!-- Glyph order will be extracted from the font -->\n"
           "    <GlyphID id=\"0\" name=\".notdef\"/>\n"
           "  </GlyphOrder>\n\n";
}

std::string TTXWriter::generateTableXML(const FontTable& table) const {
    return table.toXML() + "\n";
}

std::string TTXWriter::generateFooter() const {
    return "</ttFont>\n";
}

bool TTXWriter::shouldIncludeTable(const std::string& tag, const TTXOptions& options) const {
    // Check skip list
    if (!options.skipTables.empty()) {
        for (const auto& skipTag : options.skipTables) {
            if (tag == skipTag) {
                return false;
            }
        }
    }
    
    // Check only list
    if (!options.onlyTables.empty()) {
        for (const auto& onlyTag : options.onlyTables) {
            if (tag == onlyTag) {
                return true;
            }
        }
        return false;
    }
    
    return true;
}

// TTXParser implementation
bool TTXParser::parseXML(const std::string& xml) {
    // This is a simplified implementation
    // A real implementation would use a proper XML parser
    tables_.clear();
    return true;
}

ByteArray TTXParser::generateFont(const TTXOptions& options) const {
    // Simplified font generation
    // In a real implementation, this would reconstruct the binary font
    ByteArray result;
    
    // Generate a minimal TTF header
    uint32_t sfntVersion = 0x00010000;
    uint16_t numTables = static_cast<uint16_t>(tables_.size());
    
    result.resize(12);
    result[0] = (sfntVersion >> 24) & 0xFF;
    result[1] = (sfntVersion >> 16) & 0xFF;
    result[2] = (sfntVersion >> 8) & 0xFF;
    result[3] = sfntVersion & 0xFF;
    
    result[4] = (numTables >> 8) & 0xFF;
    result[5] = numTables & 0xFF;
    
    // Additional header fields would be calculated here
    
    return result;
}

// TTXProcessor implementation
FontFormat TTXProcessor::detectFormat(const ByteArray& data) const {
    return reader_.detectFormat(data);
}

FontInfo TTXProcessor::getFontInfo(const ByteArray& data, const TTXOptions& options) const {
    if (!reader_.loadFont(data)) {
        return FontInfo(); // Return empty info on failure
    }
    return reader_.getFontInfo();
}

TTXResult TTXProcessor::dumpToTTX(const ByteArray& fontData, const TTXOptions& options) const {
    TTXResult result;
    
    if (!reader_.loadFont(fontData)) {
        result.warnings.push_back("Failed to load font data");
        return result;
    }
    
    std::string xmlOutput = writer_.convertToXML(reader_, options);
    result.data.assign(xmlOutput.begin(), xmlOutput.end());
    result.format = "TTX";
    result.success = true;
    
    return result;
}

TTXResult TTXProcessor::compileFromTTX(const std::string& ttxData, const TTXOptions& options) const {
    TTXResult result;
    
    if (!parser_.parseXML(ttxData)) {
        result.warnings.push_back("Failed to parse TTX XML");
        return result;
    }
    
    result.data = parser_.generateFont(options);
    result.format = options.flavor.empty() ? "TTF" : options.flavor;
    result.success = true;
    
    return result;
}

std::vector<std::string> TTXProcessor::listTables(const ByteArray& fontData, const TTXOptions& options) const {
    if (!reader_.loadFont(fontData)) {
        return std::vector<std::string>();
    }
    return reader_.getTableList();
}

} // namespace ttx_wasm

// C API implementation
extern "C" {

static ttx_wasm::TTXProcessor processor;

void* ttx_alloc(size_t size) {
    return malloc(size);
}

void ttx_free(void* ptr) {
    free(ptr);
}

int ttx_detect_format(const uint8_t* data, size_t size) {
    if (!data || size == 0) {
        return static_cast<int>(ttx_wasm::FontFormat::UNKNOWN);
    }
    
    ttx_wasm::ByteArray fontData(data, data + size);
    ttx_wasm::FontFormat format = processor.detectFormat(fontData);
    return static_cast<int>(format);
}

int ttx_get_font_info(const uint8_t* data, size_t size, char* info_json, size_t info_size) {
    if (!data || size == 0 || !info_json || info_size == 0) {
        return 0;
    }
    
    ttx_wasm::ByteArray fontData(data, data + size);
    ttx_wasm::FontInfo info = processor.getFontInfo(fontData);
    
    // Convert info to JSON (simplified)
    std::stringstream ss;
    ss << "{\"format\":\"" << static_cast<int>(info.format) << "\","
       << "\"tables\":[";
    
    for (size_t i = 0; i < info.tables.size(); ++i) {
        ss << "\"" << info.tables[i] << "\"";
        if (i < info.tables.size() - 1) ss << ",";
    }
    
    ss << "]}";
    
    std::string json = ss.str();
    if (json.length() >= info_size) {
        return 0; // Buffer too small
    }
    
    strcpy(info_json, json.c_str());
    return 1;
}

int ttx_dump_to_ttx(const uint8_t* font_data, size_t font_size,
                    const char* options_json,
                    char** ttx_output, size_t* ttx_size) {
    if (!font_data || font_size == 0 || !ttx_output || !ttx_size) {
        return 0;
    }
    
    ttx_wasm::ByteArray fontData(font_data, font_data + font_size);
    ttx_wasm::TTXOptions options; // TODO: Parse options from JSON
    
    ttx_wasm::TTXResult result = processor.dumpToTTX(fontData, options);
    
    if (!result.success) {
        return 0;
    }
    
    *ttx_size = result.data.size();
    *ttx_output = static_cast<char*>(ttx_alloc(*ttx_size + 1));
    
    if (!*ttx_output) {
        return 0;
    }
    
    memcpy(*ttx_output, result.data.data(), *ttx_size);
    (*ttx_output)[*ttx_size] = '\0';
    
    return 1;
}

int ttx_compile_from_ttx(const char* ttx_data, size_t ttx_size,
                         const char* options_json,
                         uint8_t** font_output, size_t* font_size) {
    if (!ttx_data || ttx_size == 0 || !font_output || !font_size) {
        return 0;
    }
    
    std::string ttxString(ttx_data, ttx_size);
    ttx_wasm::TTXOptions options; // TODO: Parse options from JSON
    
    ttx_wasm::TTXResult result = processor.compileFromTTX(ttxString, options);
    
    if (!result.success) {
        return 0;
    }
    
    *font_size = result.data.size();
    *font_output = static_cast<uint8_t*>(ttx_alloc(*font_size));
    
    if (!*font_output) {
        return 0;
    }
    
    memcpy(*font_output, result.data.data(), *font_size);
    return 1;
}

int ttx_list_tables(const uint8_t* data, size_t size,
                    char** tables_json, size_t* json_size) {
    if (!data || size == 0 || !tables_json || !json_size) {
        return 0;
    }
    
    ttx_wasm::ByteArray fontData(data, data + size);
    std::vector<std::string> tables = processor.listTables(fontData);
    
    // Convert to JSON
    std::stringstream ss;
    ss << "[";
    for (size_t i = 0; i < tables.size(); ++i) {
        ss << "\"" << tables[i] << "\"";
        if (i < tables.size() - 1) ss << ",";
    }
    ss << "]";
    
    std::string json = ss.str();
    *json_size = json.length();
    *tables_json = static_cast<char*>(ttx_alloc(*json_size + 1));
    
    if (!*tables_json) {
        return 0;
    }
    
    strcpy(*tables_json, json.c_str());
    return 1;
}

void ttx_cleanup_output(void* ptr) {
    ttx_free(ptr);
}

} // extern "C"
