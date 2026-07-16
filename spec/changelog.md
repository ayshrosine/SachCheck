# SachCheck Changelog

All notable changes to SachCheck will be documented in this file.

## [1.0.1] - July 16, 2026

### Fixed
- Fixed Pydantic warnings about "model_" namespace conflicts in schemas
- Fixed database connection errors when Supabase credentials are missing
- Fixed storage upload failures when R2 credentials are missing
- Fixed model router crashes when Google AI Studio API key is missing

### Added
- Added graceful degradation for missing service credentials
- Added database-less mode for development without Supabase
- Added storage-less mode for development without R2
- Added enhanced error responses with structured error objects
- Added development-specific debug information in error responses
- Added retry_after information to rate limit error responses
- Added model_used and processing_time_ms fields to scan responses
- Added comprehensive free deployment guide in spec folder

### Changed
- Made all configuration fields optional in config.py
- Enhanced error messages with error codes, messages, and suggestions
- Improved rate limit handler to return proper JSON responses
- Updated all documentation with configuration improvements
- Enhanced health check responses with detailed service status

### Security
- Enhanced error responses to avoid exposing sensitive information in production
- Added proper error handling for missing credentials
- Improved input validation error messages

### Documentation
- Updated README.md with debugging improvements and troubleshooting
- Updated AGENTS.md with optional configuration notes
- Updated SETUP.md with enhanced configuration instructions
- Updated API specification with enhanced error response examples
- Updated technical specifications with error handling details
- Updated implementation roadmap with debugging improvements
- Added comprehensive free deployment guide

### Testing
- Successfully tested backend startup without credentials
- Successfully tested frontend startup and API connectivity
- Verified health check endpoints return proper status
- Confirmed graceful degradation works as expected

## [1.0.0] - July 15, 2026

### Initial Release
- Complete SachCheck deepfake detection system
- Backend with FastAPI and Gemma 4 integration
- Frontend with Next.js
- Mobile app with React Native and Expo
- Docker deployment configuration
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation
- Security and privacy features
- Multi-modal analysis (video, audio, image)

---

## Version Format

The version format follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related changes
- **Documentation**: Documentation updates
- **Testing**: Testing-related changes